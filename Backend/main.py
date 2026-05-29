from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import Literal, List, Optional
import pickle
import numpy as np
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# Database Imports
import database, models

# JWT Imports
from datetime import datetime, timedelta
from jose import JWTError, jwt

# ---------------------------
# LOAD ENV VARIABLES
# ---------------------------

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "mysecretkey")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---------------------------
# DATABASE INIT
# ---------------------------

models.Base.metadata.create_all(bind=database.engine)

# ---------------------------
# FASTAPI INIT
# ---------------------------

app = FastAPI(title="DTMS Integrated Backend")

# ---------------------------
# CORS
# ---------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# DATABASE DEPENDENCY
# ---------------------------

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------
# TOKEN FUNCTIONS
# ---------------------------

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(hours=2)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user

# ---------------------------
# GEMINI AI
# ---------------------------

gemini_key = os.getenv("GEMINI_API_KEY")

chat_model = None

if gemini_key:
    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)

        chat_model = genai.GenerativeModel(
            'gemini-flash-latest'
        )

        print("Gemini Chatbot initialized.")

    except:
        print("Gemini setup failed.")

# ---------------------------
# ML MODEL
# ---------------------------

try:
    model = pickle.load(open("disaster_model.pkl", "rb"))

except Exception as e:
    print(f"Model loading failed: {e}")
    model = None

# ---------------------------
# PYDANTIC MODELS
# ---------------------------

class UserBase(BaseModel):
    user_id: str
    name: str
    age: int = Field(..., ge=0, le=120)
    role: Literal["student", "elderly"] = "student"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    user_id: str
    password: str

class QuizSubmission(BaseModel):
    user_id: str
    score: int = Field(..., ge=0, le=100)

class DrillSubmission(BaseModel):
    user_id: str
    disaster_type: str
    performance: int = Field(..., ge=0, le=100)

class CourseSubmission(BaseModel):
    user_id: str
    course_name: str
    progress: int = 0
    viewed_sections: List[str] = []

class ChatRequest(BaseModel):
    message: str

class PredictRequest(BaseModel):
    rainfall: float
    temperature: float
    humidity: float

# ---------------------------
# AUTH ROUTES
# ---------------------------

@app.post("/user/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.user_id == user.user_id
    ).first()

    if db_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    new_user = models.User(
        user_id=user.user_id,
        name=user.name,
        age=user.age,
        role=user.role,
        password=user.password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "User registered successfully"
    }

@app.post("/user/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.user_id == user.user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid User ID"
        )

    if db_user.password != user.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    access_token = create_access_token(
        data={"sub": db_user.user_id}
    )

    return {
        "status": "success",
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/user/me")
def read_users_me(
    current_user: models.User = Depends(get_current_user)
):

    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "age": current_user.age,
        "role": current_user.role
    }

@app.get("/user/{user_id}")
def get_user(
    user_id: str,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not db_user:
        raise HTTPException(404, "User not found")

    return {
        "user_id": db_user.user_id,
        "name": db_user.name,
        "age": db_user.age,
        "role": db_user.role
    }

# ---------------------------
# PREDICTION ROUTE
# ---------------------------

@app.post("/predict")
def predict(data: PredictRequest):

    if not model:
        raise HTTPException(
            status_code=500,
            detail="ML Model not loaded"
        )

    try:
        import pandas as pd

        input_df = pd.DataFrame(
            [[
                data.rainfall,
                data.temperature,
                data.humidity
            ]],
            columns=[
                'Rainfall',
                'Temperature',
                'Humidity'
            ]
        )

        prediction = model.predict(input_df)[0]

        if data.rainfall > 100:
            disaster_type = "Flood"

        elif data.temperature > 40:
            disaster_type = "Heatwave"

        elif data.humidity > 85:
            disaster_type = "Storm"

        else:
            disaster_type = "Normal Conditions"

        return {
            "prediction": int(prediction),
            "type": disaster_type
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# ---------------------------
# CHATBOT ROUTE
# ---------------------------

@app.post("/chat")
def chat(request: ChatRequest):

    if not chat_model:
        return {
            "reply": "Chatbot offline."
        }

    try:
        prompt = f"""
        You are a disaster management assistant.

        User:
        {request.message}
        """

        response = chat_model.generate_content(prompt)

        return {
            "reply": response.text
        }

    except Exception as e:
        return {
            "error": str(e)
        }

# ---------------------------
# QUIZ ROUTE
# ---------------------------

@app.post("/quiz/submit")
def submit_quiz(
    result: QuizSubmission,
    db: Session = Depends(get_db)
):

    new_result = models.QuizResult(
        user_id=result.user_id,
        score=result.score
    )

    db.add(new_result)

    db.commit()

    return {
        "message": "Quiz result saved"
    }

# ---------------------------
# DRILL ROUTE
# ---------------------------

@app.post("/drill/submit")
def submit_drill(
    drill: DrillSubmission,
    db: Session = Depends(get_db)
):

    new_drill = models.DrillResult(
        user_id=drill.user_id,
        disaster_type=drill.disaster_type,
        performance=drill.performance
    )

    db.add(new_drill)

    db.commit()

    return {
        "message": "Drill result saved"
    }

# ---------------------------
# COURSE ROUTE
# ---------------------------

@app.post("/course/submit")
def submit_course(
    course: CourseSubmission,
    db: Session = Depends(get_db)
):

    new_completion = models.CourseCompletion(
        user_id=course.user_id,
        course_name=course.course_name,
        progress=course.progress
    )

    db.add(new_completion)

    db.commit()

    return {
        "message": "Course completion saved"
    }

# ---------------------------
# DASHBOARD
# ---------------------------

@app.get("/dashboard/{user_id}")
def dashboard(
    user_id: str,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    latest_quiz = db.query(
        models.QuizResult
    ).filter(
        models.QuizResult.user_id == user_id
    ).order_by(
        models.QuizResult.id.desc()
    ).first()

    quiz_score = latest_quiz.score if latest_quiz else 0

    drills = db.query(
        models.DrillResult
    ).filter(
        models.DrillResult.user_id == user_id
    ).all()

    avg_drill = (
        sum(d.performance for d in drills) // len(drills)
        if drills else 0
    )

    overall = (quiz_score + avg_drill) // 2

    return {
        "name": db_user.name,
        "quiz_score": quiz_score,
        "drill_score": avg_drill,
        "overall_progress": overall
    }

# ---------------------------
# FRONTEND HOSTING
# ---------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# Serve entire Frontend folder

app.mount(
    "/",
    StaticFiles(
        directory=str(BASE_DIR / "Frontend"),
        html=True
    ),
    name="frontend"
)