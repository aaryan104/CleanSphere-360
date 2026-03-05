@echo off
echo Starting CleanSphere 360...
echo.

echo Starting Backend...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo Application is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Login with admin@cleansphere.com / admin123
echo Press any key to exit...
pause
