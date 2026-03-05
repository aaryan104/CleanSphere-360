@echo off
echo Setting up CleanSphere 360...
echo.

echo Step 1: Setting up Backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt

echo.
echo Step 2: Creating .env file...
echo CLOUDINARY_CLOUD_NAME=demo > .env
echo CLOUDINARY_API_KEY=demo >> .env
echo CLOUDINARY_API_SECRET=demo >> .env
echo SECRET_KEY=your-secret-key-here-change-this-in-production >> .env
echo ALGORITHM=HS256 >> .env
echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env

echo.
echo Step 3: Setting up Frontend...
cd ..\frontend
call npm install

echo.
echo Setup Complete!
echo.
echo To run the application:
echo 1. Backend: cd backend && venv\Scripts\activate && python main.py
echo 2. Frontend: cd frontend && npm start
echo.
echo Access the app at: http://localhost:3000
echo Login with admin@cleansphere.com / admin123
pause
