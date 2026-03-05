from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import cloudinary
import cloudinary.uploader
import os

from database import get_db, Task, Feedback, TaskLog, UserRole, CleaningRequest
from models import (
    UserCreate, UserResponse, TaskCreate, TaskUpdate, TaskResponse,
    FeedbackCreate, FeedbackResponse, TaskLogResponse, DashboardStats,
    Token, LoginRequest, CleaningRequestCreate, CleaningRequestResponse
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash, require_admin, require_role, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES,
    User
)

app = FastAPI(title="CleanSphere 360 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "demo"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "demo"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "demo")
)

@app.get("/test")
def test_endpoint():
    return {"message": "Backend is working", "status": "ok"}

@app.post("/test")
def test_post():
    return {"message": "POST test working", "status": "ok"}

@app.get("/test-auth")
def test_auth_endpoint(current_user: User = Depends(get_current_active_user)):
    return {"message": "Auth working", "user": current_user.email, "status": "ok"}

@app.post("/debug")
def debug_endpoint(data: dict):
    return {"received": data}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = get_password_hash(user.password)
        
        # Convert string role to enum - handle both lowercase and uppercase
        user_role = UserRole.user
        if user.role.lower() == "admin":
            user_role = UserRole.admin
        elif user.role.lower() == "staff":
            user_role = UserRole.staff
        elif user.role.lower() == "user":
            user_role = UserRole.user
        
        db_user = User(
            name=user.name,
            email=user.email,
            password=hashed_password,
            role=user_role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role.value,
            "created_at": db_user.created_at
        }
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@app.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    db_task = Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    log = TaskLog(task_id=db_task.id, status="pending", notes="Task created")
    db.add(log)
    db.commit()
    
    return db_task

@app.get("/tasks", response_model=List[TaskResponse])
def get_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Task)
    if current_user.role == UserRole.staff:
        query = query.filter(Task.assigned_to == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role == UserRole.STAFF and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    return task

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    taskUpdate: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if current_user.role == UserRole.staff and task.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
        update_data = taskUpdate.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

@app.get("/tasks/{task_id}/logs", response_model=List[TaskLogResponse])
def get_task_logs(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role == UserRole.STAFF and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    
    logs = db.query(TaskLog).filter(TaskLog.task_id == task_id).all()
    return logs

@app.post("/feedback", response_model=FeedbackResponse)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_feedback = Feedback(
        user_id=current_user.id,
        message=feedback.message,
        rating=feedback.rating,
        image_url=feedback.image_url
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@app.get("/feedback", response_model=List[FeedbackResponse])
def get_feedback(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.admin:
        # Admin sees all feedback
        feedback = db.query(Feedback).offset(skip).limit(limit).all()
    else:
        # Regular users see only their own feedback
        feedback = db.query(Feedback).filter(Feedback.user_id == current_user.id).offset(skip).limit(limit).all()
    return feedback

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # For demo purposes, return a placeholder URL
        # In production, this would upload to Cloudinary
        return {"url": f"https://picsum.photos/seed/{file.filename}/400/300.jpg"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Admin sees all stats
    if current_user.role == UserRole.admin:
        total_tasks = db.query(Task).count()
        completed_tasks = db.query(Task).filter(Task.status == "completed").count()
        pending_tasks = db.query(Task).filter(Task.status == "pending").count()
        in_progress_tasks = db.query(Task).filter(Task.status == "in_progress").count()
        total_users = db.query(User).count()
        total_feedback = db.query(Feedback).count()
    # Staff sees their own task stats
    elif current_user.role == UserRole.staff:
        total_tasks = db.query(Task).filter(Task.assigned_to == current_user.id).count()
        completed_tasks = db.query(Task).filter(Task.assigned_to == current_user.id, Task.status == "completed").count()
        pending_tasks = db.query(Task).filter(Task.assigned_to == current_user.id, Task.status == "pending").count()
        in_progress_tasks = db.query(Task).filter(Task.assigned_to == current_user.id, Task.status == "in_progress").count()
        total_users = 0  # Staff don't need to see user count
        total_feedback = 0  # Staff don't need to see feedback count
    # Users see their feedback stats
    else:
        total_tasks = 0
        completed_tasks = 0
        pending_tasks = 0
        in_progress_tasks = 0
        total_users = 0
        total_feedback = db.query(Feedback).filter(Feedback.user_id == current_user.id).count()
    
    return DashboardStats(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        total_users=total_users,
        total_feedback=total_feedback
    )

@app.get("/staff/tasks")
def get_staff_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.staff:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
        return tasks
    except Exception as e:
        print(f"Error fetching staff tasks: {e}")
        return []

@app.get("/cleaning-requests", response_model=List[CleaningRequestResponse])
def get_cleaning_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    requests = db.query(CleaningRequest).order_by(CleaningRequest.created_at.desc()).all()
    return requests

@app.post("/cleaning-requests", response_model=CleaningRequestResponse)
def create_cleaning_request(
    data: CleaningRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cleaning_request = CleaningRequest(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        location=data.location,
        image_url=data.image_url,
        priority=data.priority
    )
    db.add(cleaning_request)
    db.commit()
    db.refresh(cleaning_request)
    return cleaning_request

from pydantic import BaseModel

class AssignRequest(BaseModel):
    staff_id: int

@app.post("/cleaning-requests/{request_id}/assign")
def assign_cleaning_request(
    request_id: int,
    assign_data: AssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    cleaning_request = db.query(CleaningRequest).filter(CleaningRequest.id == request_id).first()
    if not cleaning_request:
        raise HTTPException(status_code=404, detail="Cleaning request not found")
    
    staff_user = db.query(User).filter(User.id == assign_data.staff_id, User.role == UserRole.staff).first()
    if not staff_user:
        raise HTTPException(status_code=404, detail="Staff user not found")
    
    # Create task from cleaning request
    task = Task(
        title=cleaning_request.title,
        description=cleaning_request.description,
        location=cleaning_request.location,
        assigned_to=assign_data.staff_id,
        cleaning_request_id=cleaning_request.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Update cleaning request
    cleaning_request.assigned_to = assign_data.staff_id
    cleaning_request.task_id = task.id
    cleaning_request.status = "in_progress"
    db.commit()
    
    return {"message": "Cleaning request assigned successfully", "task_id": task.id}

@app.post("/seed-data")
def seed_data(db: Session = Depends(get_db)):
    try:
        # Clear existing data except users
        db.query(Feedback).delete()
        db.query(Task).delete()
        db.query(CleaningRequest).delete()
        db.commit()
        
        # Get or create users
        admin_user = db.query(User).filter(User.email == "admin@cleansphere.com").first()
        if not admin_user:
            admin_user = User(name="Admin User", email="admin@cleansphere.com", password=get_password_hash("admin123"), role=UserRole.admin)
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        
        staff_user1 = db.query(User).filter(User.email == "staff@cleansphere.com").first()
        if not staff_user1:
            staff_user1 = User(name="John Staff", email="staff@cleansphere.com", password=get_password_hash("staff123"), role=UserRole.staff)
            db.add(staff_user1)
            db.commit()
            db.refresh(staff_user1)
            
        staff_user2 = db.query(User).filter(User.email == "jane.staff@cleansphere.com").first()
        if not staff_user2:
            staff_user2 = User(name="Jane Staff", email="jane.staff@cleansphere.com", password=get_password_hash("staff123"), role=UserRole.staff)
            db.add(staff_user2)
            db.commit()
            db.refresh(staff_user2)
        
        normal_user1 = db.query(User).filter(User.email == "user@cleansphere.com").first()
        if not normal_user1:
            normal_user1 = User(name="Alice User", email="user@cleansphere.com", password=get_password_hash("user123"), role=UserRole.user)
            db.add(normal_user1)
            db.commit()
            db.refresh(normal_user1)
            
        normal_user2 = db.query(User).filter(User.email == "bob.user@cleansphere.com").first()
        if not normal_user2:
            normal_user2 = User(name="Bob User", email="bob.user@cleansphere.com", password=get_password_hash("user123"), role=UserRole.user)
            db.add(normal_user2)
            db.commit()
            db.refresh(normal_user2)
        
        # Create 12 comprehensive sample tasks
        tasks_data = [
            Task(title="Clean Main Hall", description="Clean and sanitize main hall floor and windows", status="completed", assigned_to=staff_user1.id, location="Main Hall"),
            Task(title="Empty Trash Bins", description="Empty all trash bins in office area", status="pending", assigned_to=staff_user2.id, location="Office Area"),
            Task(title="Clean Restrooms", description="Sanitize all restrooms on first floor", status="in_progress", assigned_to=staff_user1.id, location="First Floor Restrooms"),
            Task(title="Vacuum Conference Room", description="Vacuum and clean conference room carpet", status="completed", assigned_to=staff_user2.id, location="Conference Room A"),
            Task(title="Mop Lobby Floor", description="Mop and polish lobby entrance floor", status="pending", assigned_to=staff_user1.id, location="Main Lobby"),
            Task(title="Clean Windows", description="Clean all exterior windows", status="in_progress", assigned_to=staff_user2.id, location="Building Exterior"),
            Task(title="Stock Supplies", description="Restock cleaning supplies in storage", status="completed", assigned_to=staff_user1.id, location="Storage Room"),
            Task(title="Clean Kitchen", description="Clean and sanitize staff kitchen area", status="pending", assigned_to=staff_user2.id, location="Staff Kitchen"),
            Task(title="Dust Office Furniture", description="Dust all office desks and chairs", status="in_progress", assigned_to=staff_user1.id, location="Office Spaces"),
            Task(title="Clean Elevators", description="Sanitize elevator interiors", status="completed", assigned_to=staff_user2.id, location="All Elevators"),
            Task(title="Mop Corridors", description="Mop all hallway corridors", status="pending", assigned_to=staff_user1.id, location="Hallways"),
            Task(title="Clean Stairways", description="Clean and sanitize staircases", status="in_progress", assigned_to=staff_user2.id, location="Emergency Stairs")
        ]
        
        db.add_all(tasks_data)
        db.commit()
        
        # Refresh tasks to get IDs
        for task in tasks_data:
            db.refresh(task)
        
        # Create 10 sample feedback entries
        feedback_data = [
            Feedback(user_id=normal_user1.id, message="Excellent cleaning service! The main hall looks spotless.", rating=5),
            Feedback(user_id=normal_user2.id, message="Very professional staff and thorough cleaning.", rating=5),
            Feedback(user_id=normal_user1.id, message="Restrooms are always clean and well-maintained.", rating=4),
            Feedback(user_id=normal_user2.id, message="Quick response to cleaning requests.", rating=4),
            Feedback(user_id=normal_user1.id, message="Great attention to detail in office cleaning.", rating=5),
            Feedback(user_id=normal_user2.id, message="Staff is friendly and efficient.", rating=4),
            Feedback(user_id=normal_user1.id, message="Consistently high quality service.", rating=5),
            Feedback(user_id=normal_user2.id, message="Very satisfied with the cleaning standards.", rating=4),
            Feedback(user_id=normal_user1.id, message="Prompt and reliable service.", rating=5),
            Feedback(user_id=normal_user2.id, message="Facilities are always clean and welcoming.", rating=5)
        ]
        
        db.add_all(feedback_data)
        db.commit()
        
        # Create 5 sample cleaning requests
        cleaning_requests_data = [
            CleaningRequest(
                user_id=normal_user1.id,
                title="Spill in Conference Room",
                description="Coffee spilled on carpet, needs immediate cleaning",
                location="Conference Room B",
                image_url="https://res.cloudinary.com/demo/image/upload/spill.jpg",
                priority="high"
            ),
            CleaningRequest(
                user_id=normal_user2.id,
                title="Dirty Restroom",
                description="Restroom needs cleaning and supplies restocked",
                location="Second Floor Restroom",
                image_url="https://res.cloudinary.com/demo/image/upload/restroom.jpg",
                priority="medium"
            ),
            CleaningRequest(
                user_id=normal_user1.id,
                title="Broken Glass",
                description="Glass broken near main entrance, needs cleanup",
                location="Main Entrance",
                image_url="https://res.cloudinary.com/demo/image/upload/glass.jpg",
                priority="high"
            ),
            CleaningRequest(
                user_id=normal_user2.id,
                title="Trash Overflow",
                description="Trash bins are full and need emptying",
                location="Office Area",
                image_url="https://res.cloudinary.com/demo/image/upload/trash.jpg",
                priority="low"
            ),
            CleaningRequest(
                user_id=normal_user1.id,
                title="Dirty Windows",
                description="Windows are dirty and need cleaning",
                location="Conference Room A",
                image_url="https://res.cloudinary.com/demo/image/upload/windows.jpg",
                priority="medium"
            )
        ]
        
        db.add_all(cleaning_requests_data)
        db.commit()
        
        return {"message": "Sample data seeded successfully! Created 12 tasks, 10 feedback, and 5 cleaning requests."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to seed data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
