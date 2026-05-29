import models
from database import SessionLocal

def check_db():
    db = SessionLocal()
    users = db.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: {u.user_id} ({u.name})")
        print(f"  Completions: {[c.course_name for c in u.course_completions]}")
        print(f"  Drills: {[(d.disaster_type, d.performance) for d in u.drill_results]}")
    db.close()

if __name__ == "__main__":
    check_db()
