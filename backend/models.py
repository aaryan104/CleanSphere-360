from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from database import UserRole

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['admin', 'staff', 'user']
        if v.lower() not in allowed_roles:
            raise ValueError(f'Role must be one of: {allowed_roles}')
        return v.lower()

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: str
    location: str

class TaskCreate(TaskBase):
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    location: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    status: str
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime
    assigned_user: Optional[UserResponse] = None
    cleaning_request_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class FeedbackBase(BaseModel):
    message: str
    rating: int

class FeedbackCreate(FeedbackBase):
    image_url: Optional[str] = None

class FeedbackResponse(FeedbackBase):
    id: int
    user_id: int
    image_url: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class TaskLogBase(BaseModel):
    status: TaskStatus
    notes: Optional[str] = None

class TaskLogResponse(TaskLogBase):
    id: int
    task_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CleaningRequestBase(BaseModel):
    title: str
    description: str
    location: str
    priority: str = "medium"

class CleaningRequestCreate(CleaningRequestBase):
    image_url: str

class CleaningRequestResponse(CleaningRequestBase):
    id: int
    user_id: int
    image_url: str
    status: TaskStatus
    priority: str
    created_at: datetime
    updated_at: datetime
    assigned_to: Optional[int] = None
    task_id: Optional[int] = None
    user: Optional[UserResponse] = None
    assigned_user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    total_users: int
    total_feedback: int
