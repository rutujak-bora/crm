#!/bin/bash

# EC2 Backend Deployment Script
# Run this on the EC2 instance

set -e

echo "=========================================="
echo "🚀 Starting Backend Deployment"
echo "=========================================="

# 1. System Setup
echo "🛠️  Updating system and installing dependencies..."
sudo apt-get update -qq
sudo apt-get install -y python3-pip python3-venv git -qq

# 2. Setup Directory
APP_DIR="/home/ubuntu/crm-backend"
mkdir -p $APP_DIR

# 3. Setup Python Environment
echo "🐍 Setting up Python virtual environment..."
if [ ! -d "$APP_DIR/venv" ]; then
    python3 -m venv "$APP_DIR/venv"
fi
source "$APP_DIR/venv/bin/activate"

# 4. Install Dependencies
echo "📦 Installing Python requirements..."
# We will upload requirements.txt separately
if [ -f "$APP_DIR/requirements.txt" ]; then
    pip install -r "$APP_DIR/requirements.txt"
else
    echo "⚠️  requirements.txt not found! Installing basics..."
    pip install fastapi uvicorn motor python-dotenv pyjwt passlib[bcrypt] python-multipart aiofiles openpyxl requests stripe
fi

# 5. Create Systemd Service
echo "⚙️  Configuring systemd service..."
sudo tee /etc/systemd/system/crm-backend.service > /dev/null <<EOF
[Unit]
Description=CRM Backend API
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 6. Start Service
echo "🔥 Starting Backend Service..."
sudo systemctl daemon-reload
sudo systemctl enable crm-backend
sudo systemctl restart crm-backend
sudo systemctl status crm-backend --no-pager

echo ""
echo "=========================================="
echo "✅ Backend Deployed Successfully!"
echo "=========================================="
echo "API is available at: http://$(curl -s ifconfig.me):8000"
echo "Docs available at:   http://$(curl -s ifconfig.me):8000/docs"
echo ""
