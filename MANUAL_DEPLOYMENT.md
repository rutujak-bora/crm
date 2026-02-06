# Manual Deployment Guide for AWS EC2

Follow these steps to deploy your CRM application manually on an Ubuntu EC2 instance.

## Step 1: System Setup
Run these commands on your EC2 instance (SSH in first).

```bash
# Update System
sudo apt update && sudo apt upgrade -y

# Install Python & Tools
sudo apt install -y python3-pip python3-venv nginx git

# Install Node.js 18 (Required for React)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Step 2: Backend Deployment

### 1. Clone Repository
```bash
cd ~
git clone https://github.com/rutujak-bora/crm.git
cd crm/backend
```

### 2. Python Environment Setup
```bash
# Create Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create the `.env` file with your production secrets.
```bash
nano .env
```
Paste the following (Edit with your real values):
```ini
MONGO_URI=mongodb+srv://user:pass@cluster...
DB_NAME=crm_db
JWT_SECRET=your_secure_secret
# Important: Add your EC2 Public IP
CORS_ORIGINS=http://<YOUR_EC2_PUBLIC_IP>,http://localhost
```
*Press `Ctrl+O`, `Enter` to save, `Ctrl+X` to exit.*

### 4. Create Backend Service (Systemd)
To keep the backend running in the background:
```bash
sudo nano /etc/systemd/system/crm-backend.service
```
Paste this configuration:
```ini
[Unit]
Description=CRM Backend API
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/crm/backend
Environment="PATH=/home/ubuntu/crm/backend/venv/bin"
ExecStart=/home/ubuntu/crm/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 5. Start Backend
```bash
sudo systemctl daemon-reload
sudo systemctl start crm-backend
sudo systemctl enable crm-backend
sudo systemctl status crm-backend
```

---

## Step 3: Frontend Deployment

### 1. Configure Build Environment
```bash
cd ~/crm/frontend
nano .env
```
Set the backend URL to `/api` (Nginx will handle the proxy):
```ini
REACT_APP_BACKEND_URL=/api
```

### 2. Build the Application
```bash
npm install
# Fix for low memory instances (if build fails)
# sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile

npm run build
```

---

## Step 4: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/crm
```
Paste this configuration:
```nginx
server {
    listen 80;
    server_name _; 

    # Serve React Frontend
    location / {
        root /home/ubuntu/crm/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site & Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Permissions fix
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/crm
sudo chmod -R 755 /home/ubuntu/crm/frontend/build

sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Verification
Visit `http://<YOUR_EC2_PUBLIC_IP>` in your browser.
