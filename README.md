# CleanSphere 360 – Smart Sanitation Management System

A comprehensive full-stack web application for managing sanitation tasks, cleaning requests, user feedback, and facility maintenance. Built with React, FastAPI, and SQLite.

## 🚀 Features

### Core Modules
- **Authentication System**: JWT-based login/signup with role-based access (Admin, Staff, User)
- **Admin Dashboard**: Real-time overview with task management, analytics, and cleaning request verification
- **Staff Panel**: Task assignment, status updates, and cleaning request processing
- **User Cleaning Requests**: Image upload for cleaning issues with priority levels
- **QR Feedback System**: Simulated QR scanning for instant user feedback with image uploads
- **Real-time Analytics**: Dashboard charts and performance metrics

### Technical Features
- Responsive design (mobile + desktop)
- Modern UI with green & blue theme
- Toast notifications
- Loading states and error handling
- Protected routes with JWT authentication
- Image upload via Cloudinary integration (placeholder URLs for demo)
- Geo-location support

## 🛠 Tech Stack

### Frontend
- **React JS** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications
- **Heroicons** for icons

### Backend
- **Python** with **FastAPI**
- **SQLite** database (for demo)
- **SQLAlchemy** ORM
- **JWT Authentication**
- **Bcrypt** for password hashing
- **Cloudinary** SDK for image uploads (placeholder for demo)

## 📋 Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Git

## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Scetathon-2026
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=sqlite:///./cleansphere.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Run the Backend Server
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Start the Frontend Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Complete Workflow Process

### Step 1: User Creates Cleaning Request
1. **Login as User**: `user@cleansphere.com` / `user123`
2. **Navigate to Cleaning Request**: Click "Cleaning Request" in navigation
3. **Upload Image**: Select image file (uses placeholder URLs for demo)
4. **Fill Details**: 
   - Title (e.g., "Spill in Conference Room")
   - Description (e.g., "Coffee spilled on carpet")
   - Location (e.g., "Conference Room B")
   - Priority (Low/Medium/High)
5. **Submit Request**: Click "Submit Request" button

### Step 2: Admin Verifies and Assigns Request
1. **Login as Admin**: `admin@cleansphere.com` / `admin123`
2. **Navigate to Manage Requests**: Click "Manage Requests" in navigation
3. **Review Request**: View all cleaning requests with images and details
4. **Assign to Staff**: 
   - Click "Assign" button on a request
   - Select staff member from dropdown
   - Click "Assign" to confirm
5. **System Creates Task**: Automatically creates task linked to cleaning request

### Step 3: Staff Processes and Completes Task
1. **Login as Staff**: `staff@cleansphere.com` / `staff123`
2. **Navigate to Tasks**: Click "Tasks" in navigation
3. **View Assigned Tasks**: See tasks with "User Request" badge
4. **Start Task**: Click "Start Task" button (status changes to "In Progress")
5. **Complete Task**: Click "Complete" button (status changes to "Completed")

### Step 4: Task Completion and Feedback
1. **Task Status Updated**: System automatically updates task status
2. **Cleaning Request Updated**: Original request marked as completed
3. **Admin Can View**: Admin sees completed tasks in dashboard

## 🗄 Database Architecture

### Database Setup
- **Type**: SQLite (for demo simplicity)
- **ORM**: SQLAlchemy
- **Auto-creation**: Database and tables created automatically on first run

### Database Tables

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to INTEGER,
    location VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cleaning_request_id INTEGER,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (cleaning_request_id) REFERENCES cleaning_requests(id)
);
```

#### Cleaning Requests Table
```sql
CREATE TABLE cleaning_requests (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(200),
    description TEXT,
    location VARCHAR(200),
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_to INTEGER,
    task_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

#### Feedback Table
```sql
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message TEXT,
    rating INTEGER,
    image_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Task Logs Table
```sql
CREATE TABLE task_logs (
    id INTEGER PRIMARY KEY,
    task_id INTEGER,
    status VARCHAR(20),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

## 📊 Data Insertion Points

### 1. User Registration
- **Endpoint**: `POST /register`
- **Table**: `users`
- **Trigger**: New user signup
- **Data**: Name, email, hashed password, role

### 2. Cleaning Request Creation
- **Endpoint**: `POST /cleaning-requests`
- **Table**: `cleaning_requests`
- **Trigger**: User submits cleaning request
- **Data**: User ID, title, description, location, image URL, priority

### 3. Task Assignment
- **Endpoint**: `POST /cleaning-requests/{request_id}/assign`
- **Tables**: `tasks`, `cleaning_requests`
- **Trigger**: Admin assigns cleaning request to staff
- **Data**: Task created with request details, request updated with task ID

### 4. Task Status Updates
- **Endpoint**: `PUT /tasks/{task_id}`
- **Table**: `tasks`
- **Trigger**: Staff updates task status
- **Data**: Status changes (pending → in_progress → completed)

### 5. Feedback Submission
- **Endpoint**: `POST /feedback`
- **Table**: `feedback`
- **Trigger**: User submits feedback
- **Data**: User ID, message, rating, image URL

### 6. Sample Data Seeding
- **Endpoint**: `POST /seed-data`
- **Tables**: All tables
- **Trigger**: Admin clicks "Seed Sample Data" button
- **Data**: Creates 12 tasks, 10 feedback entries, 5 cleaning requests, 7 users

## 🏗 Project Structure

```
Scetathon-2026/
├── backend/
│   ├── main.py              # FastAPI application with all endpoints
│   ├── database.py          # SQLAlchemy models and database setup
│   ├── models.py            # Pydantic models for API validation
│   ├── auth.py              # JWT authentication logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   └── cleansphere.db      # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context for authentication
│   │   ├── pages/           # Page components
│   │   │   ├── Dashboard.tsx        # Dashboard for all roles
│   │   │   ├── Tasks.tsx            # Task management
│   │   │   ├── CleaningRequest.tsx  # User cleaning requests
│   │   │   ├── AdminCleaningRequests.tsx # Admin request management
│   │   │   ├── Feedback.tsx         # Feedback management
│   │   │   └── QRFeedback.tsx       # QR feedback system
│   │   ├── api.ts           # API client with all endpoints
│   │   └── App.tsx          # Main app with routing
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind configuration
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /token` - Login
- `POST /register` - Register new user
- `GET /users/me` - Get current user info

### Tasks
- `GET /tasks` - Get all tasks (Admin) or assigned tasks (Staff)
- `POST /tasks` - Create new task (Admin only)
- `PUT /tasks/{id}` - Update task status
- `DELETE /tasks/{id}` - Delete task (Admin only)
- `GET /staff/tasks` - Get staff assigned tasks

### Cleaning Requests
- `GET /cleaning-requests` - Get all cleaning requests (Admin only)
- `POST /cleaning-requests` - Create cleaning request (User)
- `POST /cleaning-requests/{request_id}/assign` - Assign request to staff (Admin)

### Feedback
- `GET /feedback` - Get feedback (Admin: all, User: own)
- `POST /feedback` - Submit feedback
- `POST /upload-image` - Upload image (placeholder URLs)

### Dashboard
- `GET /dashboard/stats` - Get role-based dashboard statistics
- `POST /seed-data` - Seed comprehensive sample data

## 🎯 User Roles & Permissions

### Admin
- View dashboard analytics
- Create, edit, and delete tasks
- Assign cleaning requests to staff
- View all user feedback
- Manage users
- Seed sample data
- Access all system features

### Staff
- View assigned tasks
- Update task status (Start/Complete)
- View task history
- See tasks from cleaning requests with "User Request" badge

### User
- Submit cleaning requests with images
- View feedback history
- Submit feedback via QR system
- Access public features

## 📱 Demo Accounts

### Login Credentials:
- **Admin**: `admin@cleansphere.com` / `admin123`
- **Staff**: `staff@cleansphere.com` / `staff123`
- **User**: `user@cleansphere.com` / `user123`

### Sample Data:
After login as Admin, click "Seed Sample Data" to create:
- 7 Users (1 admin, 2 staff, 4 users)
- 12 Tasks (various statuses and locations)
- 10 Feedback entries (different ratings)
- 5 Cleaning requests (different priorities)

## 🔒 Security Features

- JWT-based authentication with 30-minute expiration
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation and sanitization
- CORS configuration for frontend-backend communication

## 🚀 Running the Application

### Step-by-Step Execution:

1. **Start Backend**:
   ```bash
   cd backend
   python main.py
   ```
   - Backend runs on `http://localhost:8000`
   - Database automatically created
   - API documentation at `http://localhost:8000/docs`

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```
   - Frontend runs on `http://localhost:3000`
   - Automatically opens in browser

3. **Seed Sample Data**:
   - Login as Admin
   - Click "Seed Sample Data" button
   - Creates comprehensive test data

4. **Test Complete Workflow**:
   - Login as User → Create cleaning request
   - Login as Admin → Assign request to staff
   - Login as Staff → Start and complete task

## 🆘 Troubleshooting

### Common Issues

1. **Backend Won't Start**
   - Check Python version (3.8+)
   - Install dependencies: `pip install -r requirements.txt`
   - Check if port 8000 is available

2. **Frontend Won't Start**
   - Check Node.js version (16+)
   - Install dependencies: `npm install`
   - Check if port 3000 is available

3. **Database Issues**
   - SQLite database auto-creates, no setup needed
   - If corrupted, delete `cleansphere.db` and restart backend

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT secret key in .env
   - Verify login credentials

5. **Image Upload Issues**
   - Uses placeholder URLs for demo
   - No Cloudinary setup required for basic functionality

### Development Tips

- Use browser dev tools for debugging API calls
- Check network tab for request/response details
- Backend API docs available at `http://localhost:8000/docs`
- Enable console logs for frontend debugging

---

**CleanSphere 360** - Making sanitation management smarter and more efficient! 🌟
