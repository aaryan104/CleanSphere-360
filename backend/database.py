from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

SQLALCHEMY_DATABASE_URL = "sqlite:///./cleansphere.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserRole(enum.Enum):
    admin = "admin"
    staff = "staff"
    user = "user"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(Enum(UserRole, name="userrole"), default=UserRole.user)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assigned_tasks = relationship("Task", back_populates="assigned_user", foreign_keys="Task.assigned_to")
    feedback = relationship("Feedback", back_populates="user", foreign_keys="Feedback.user_id")
    cleaning_requests = relationship("CleaningRequest", back_populates="user", foreign_keys="CleaningRequest.user_id")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    status = Column(Enum("pending", "in_progress", "completed", name="taskstatus"), default="pending")
    assigned_to = Column(Integer, ForeignKey("users.id"))
    location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cleaning_request_id = Column(Integer, ForeignKey("cleaning_requests.id"), nullable=True)
    
    assigned_user = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    logs = relationship("TaskLog", back_populates="task")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    rating = Column(Integer)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="feedback")

class CleaningRequest(Base):
    __tablename__ = "cleaning_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    location = Column(String)
    image_url = Column(String)
    status = Column(Enum("pending", "in_progress", "completed"), default="pending")
    priority = Column(String, default="medium")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    
    user = relationship("User", back_populates="cleaning_requests", foreign_keys=[user_id])
    assigned_user = relationship("User", foreign_keys=[assigned_to])

class TaskLog(Base):
    __tablename__ = "task_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    status = Column(Enum("pending", "in_progress", "completed"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    task = relationship("Task", back_populates="logs")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base.metadata.create_all(bind=engine)
