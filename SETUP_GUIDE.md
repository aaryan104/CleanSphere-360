# CleanSphere 360 - Setup Guide for New Laptop

## 🚀 Complete Setup Instructions

### 📋 Prerequisites

#### 1. Install Python (3.8+)
```bash
# Check if Python is installed
python --version
# or
python3 --version

# If not installed, download from: https://www.python.org/downloads/
```

#### 2. Install Node.js (16+)
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
```

#### 3. Install Git
```bash
# Check if Git is installed
git --version

# If not installed, download from: https://git-scm.com/
```

---

### 🗂️ Project Setup

#### 1. Clone or Copy Project
```bash
# Option 1: Clone from repository (if available)
git clone <repository-url>
cd Scetathon-2026

# Option 2: Copy project folder to new laptop
# Navigate to the project directory
cd Scetathon-2026
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from existing or create new)
# Create backend/.env file with:
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=demo
CLOUDINARY_API_SECRET=demo
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# or if npm install fails, try:
npm install --force
```

---

### 🏃‍♂️ Running the Application

#### 1. Start Backend
```bash
# In backend directory (with virtual environment activated)
python main.py
# or
uvicorn main:app --reload --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

#### 2. Start Frontend (New Terminal)
```bash
# In frontend directory (new terminal window)
npm start

# You should see:
# Compiled successfully!
# You can now view frontend in the browser.
# Local:            http://localhost:3000
```

---

### 🔧 Common Issues & Solutions

#### Issue 1: Python Module Not Found
```bash
# Error: ModuleNotFoundError: No module named 'fastapi'
# Solution: Install dependencies
pip install -r requirements.txt
```

#### Issue 2: Virtual Environment Not Activating
```bash
# Windows: Try full path
C:\path\to\project\backend\venv\Scripts\activate

# Mac/Linux: Try full path
source /path/to/project/backend/venv/bin/activate
```

#### Issue 3: Frontend npm Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue 4: Port Already in Use
```bash
# Kill processes using ports 8000 and 3000
# Windows:
netstat -ano | findstr :8000
taskkill /F /PID <PID>
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Mac/Linux:
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

#### Issue 5: Image Upload Error
```bash
# This is usually due to missing python-multipart
pip install python-multipart

# Or reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

---

### 🌐 Access the Application

#### Backend API
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/test

#### Frontend Application
- **URL**: http://localhost:3000
- **Login Page**: http://localhost:3000/login

---

### 👤 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cleansphere.com | admin123 |
| Staff | staff@cleansphere.com | staff123 |
| User | user@cleansphere.com | user123 |

---

### 📱 Testing the Setup

#### 1. Test Backend
```bash
# Test backend health
curl http://localhost:8000/test

# Should return:
# {"message": "Backend is working", "status": "ok"}
```

#### 2. Test Frontend
- Open browser to http://localhost:3000
- Login with admin credentials
- Check if dashboard loads

#### 3. Test Image Upload
- Try creating a cleaning request
- Upload an image
- Check if it works without errors

---

### 🛠️ Development Tips

#### 1. Keep Both Terminals Open
- Terminal 1: Backend running
- Terminal 2: Frontend running

#### 2. Check Logs
- Backend logs show in terminal
- Frontend logs show in browser console (F12)

#### 3. Database Reset
```bash
# Delete database file to reset
rm backend/cleansphere.db
# Restart backend to recreate database
```

---

### 📞 Troubleshooting

If you encounter any issues:

1. **Check Python Version**: `python --version` (should be 3.8+)
2. **Check Node Version**: `node --version` (should be 16+)
3. **Verify Dependencies**: Ensure all requirements are installed
4. **Check Ports**: Make sure 8000 and 3000 are free
5. **Clear Caches**: Clear npm and pip caches if needed

---

### 🎯 Quick Start Summary

```bash
# 1. Setup Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# 2. Setup Frontend (new terminal)
cd frontend
npm install
npm start

# 3. Access Application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

**🎉 Your CleanSphere 360 application should now be running on the new laptop!**
