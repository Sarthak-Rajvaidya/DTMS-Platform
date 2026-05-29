import database
import models
from sqlalchemy import text

def reset_progress_table():
    engine = database.engine
    with engine.connect() as conn:
        print("Dropping course_completions table...")
        conn.execute(text("DROP TABLE IF EXISTS course_completions"))
        conn.commit()
    
    print("Recreating tables...")
    models.Base.metadata.create_all(bind=engine)
    print("Done! Database schema updated.")

if __name__ == "__main__":
    reset_progress_table()
