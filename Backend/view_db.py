import sqlite3

import os

def view_database():
    try:
        # Determine path to DB (handles running from Backend or Root)
        db_path = 'dtms.db' if os.path.exists('dtms.db') else 'Backend/dtms.db'
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        print("\n" + "="*50)
        print("DTMS DATABASE OVERVIEW")
        print("="*50)
        
        # Get list of tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cur.fetchall()
        
        for (table_name,) in tables:
            if table_name.startswith('sqlite'): continue
            
            print(f"\nTABLE: {table_name}")
            print("-" * 30)
            
            # Get columns
            cur.execute(f"PRAGMA table_info({table_name})")
            cols = [col[1] for col in cur.fetchall()]
            print(" | ".join(cols))
            print("-" * 30)
            
            # Get data
            cur.execute(f"SELECT * FROM {table_name}")
            rows = cur.fetchall()
            if not rows:
                print("(No data)")
            for row in rows:
                print(" | ".join(map(str, row)))
            print("-" * 30)
            
        conn.close()
    except Exception as e:
        print(f"Error reading database: {e}")

if __name__ == "__main__":
    view_database()
