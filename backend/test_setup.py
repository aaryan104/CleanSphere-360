from database import SessionLocal, User, Task, TaskStatus, UserRole
from auth import get_password_hash
import sqlalchemy

def create_test_data():
    db = SessionLocal()
    try:
        # Check if users already exist
        existing_admin = db.query(User).filter(User.email == "admin@cleansphere.com").first()
        if existing_admin:
            print("Test data already exists")
            return
        
        # Create users
        admin_user = User(
            name="Admin User",
            email="admin@cleansphere.com",
            password=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        
        staff_user = User(
            name="Staff User",
            email="staff@cleansphere.com",
            password=get_password_hash("staff123"),
            role=UserRole.STAFF
        )
        
        regular_user = User(
            name="Regular User",
            email="user@cleansphere.com",
            password=get_password_hash("user123"),
            role=UserRole.USER
        )
        
        db.add_all([admin_user, staff_user, regular_user])
        db.commit()
        
        db.refresh(admin_user)
        db.refresh(staff_user)
        db.refresh(regular_user)
        
        # Create sample tasks
        sample_tasks = [
            Task(
                title="Clean Restroom A",
                description="Clean and sanitize the main restroom",
                status=TaskStatus.PENDING,
                assigned_to=staff_user.id,
                location="Building A, Floor 1"
            ),
            Task(
                title="Empty Trash Bins",
                description="Empty all trash bins in the corridor",
                status=TaskStatus.IN_PROGRESS,
                assigned_to=staff_user.id,
                location="Building B, Floor 2"
            ),
            Task(
                title="Mop Lobby Floor",
                description="Mop and clean the lobby area",
                status=TaskStatus.COMPLETED,
                assigned_to=staff_user.id,
                location="Main Lobby"
            )
        ]
        
        db.add_all(sample_tasks)
        db.commit()
        
        print("Test data created successfully!")
        print("Login credentials:")
        print("Admin: admin@cleansphere.com / admin123")
        print("Staff: staff@cleansphere.com / staff123")
        print("User: user@cleansphere.com / user123")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()
