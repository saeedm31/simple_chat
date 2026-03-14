from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Friend, Message, Base

DB_URL = "sqlite:///massenger.db"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_lookup(name):
    db = SessionLocal()
    print(f"--- Diagnostic for name: '{name}' ---")
    
    # List all friends for visibility
    all_friends = db.query(Friend).all()
    print(f"Total friends in DB: {len(all_friends)}")
    for f in all_friends:
        print(f"  - ID: {f.id}, Name: '{f.name}', Token: '{f.token[:8]}...'")
    
    # Test ILIKE lookup
    friend = db.query(Friend).filter(Friend.name.ilike(name)).first()
    if friend:
        print(f"\n✅ Found match for '{name}':")
        print(f"  Name in DB: '{friend.name}'")
        print(f"  Token: {friend.token}")
    else:
        print(f"\n❌ No match found for '{name}' using ILIKE.")
    
    db.close()

if __name__ == "__main__":
    import sys
    name_to_search = sys.argv[1] if len(sys.argv) > 1 else "Sara"
    test_lookup(name_to_search)
