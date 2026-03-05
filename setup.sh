#!/bin/bash

echo "Setting up CleanSphere 360..."
echo

echo "Step 1: Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo
echo "Step 2: Creating .env file..."
cat > .env << EOF
CLOUDINARY_CLOUD_NAME=demo
CLOUDINARY_API_KEY=demo
CLOUDINARY_API_SECRET=demo
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

echo
echo "Step 3: Setting up Frontend..."
cd ../frontend
npm install

echo
echo "Setup Complete!"
echo
echo "To run the application:"
echo "1. Backend: cd backend && source venv/bin/activate && python main.py"
echo "2. Frontend: cd frontend && npm start"
echo
echo "Access the app at: http://localhost:3000"
echo "Login with admin@cleansphere.com / admin123"
