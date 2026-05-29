from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    role = Column(String)
    password = Column(String) # For simple auth demo

    quiz_results = relationship("QuizResult", back_populates="owner")
    drill_results = relationship("DrillResult", back_populates="owner")
    course_completions = relationship("CourseCompletion", back_populates="owner")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    score = Column(Integer)

    owner = relationship("User", back_populates="quiz_results")

class DrillResult(Base):
    __tablename__ = "drill_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    disaster_type = Column(String)
    performance = Column(Integer)

    owner = relationship("User", back_populates="drill_results")

class CourseCompletion(Base):
    __tablename__ = "course_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    course_name = Column(String)
    progress = Column(Integer, default=0)
    viewed_sections = Column(String, default="[]") # Stored as JSON string

    owner = relationship("User", back_populates="course_completions")
