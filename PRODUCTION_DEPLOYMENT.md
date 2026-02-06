# Production Deployment Guide - Build Locally, Deploy to EC2

This guide walks you through deploying your CRM application to AWS EC2 (Ubuntu 24.04, t3 instance) **without building on the server** to avoid memory issues.

## 📋 Prerequisites

- AWS EC2 instance running Ubuntu 24.04 (t3 instance)
- EC2 Security Group allows ports: 22 (SSH), 80 (HTTP), 8000 (Backend API)
- SSH key pair (.pem file) for EC2 access
- Local machine with Node.js and npm installed
- Backend already deployed and running on EC2 port 8000

---

## 🚀 Deployment Steps

### Step 1: Build Frontend Locally ✅ COMPLETED

**Run these commands on your LOCAL machine:**

```powershell
# Navigate to frontend directory
cd d:\Downloads\CRM\frontend

# Clean previous builds
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# Install dependencies
npm install --legacy-peer-deps

# Build for production (ignore ESLint warnings)
$env:CI='false'; npm run build
```

**✅ Status: Build completed successfully!**
- Build folder location: `d:\Downloads\CRM\frontend\build`
- Build size: ~183 KB (gzipped)

---

### Step 2: Upload Build to EC2

**Option A: Using SCP (Recommended)**

```powershell
# Replace with your actual EC2 details
$EC2_IP = "YOUR_EC2_PUBLIC_IP"
$KEY_PATH = "C:\path\to\your-key.pem"

# Upload the build folder to EC2
scp -i $KEY_PATH -r d:\Downloads\CRM\frontend\build ubuntu@${EC2_IP}:/home/ubuntu/frontend-build
```

**Option B: Using WinSCP (GUI Method)**
1. Download and install WinSCP
2. Connect to your EC2 instance using your .pem key
3. Navigate to local folder: `d:\Downloads\CRM\frontend\build`
4. Upload entire `build` folder to: `/home/ubuntu/frontend-build`

**Option C: Using Git (Alternative)**
```bash
# On EC2, clone your repo and copy the build folder
# Then upload just the build folder from local to EC2
```

---

### Step 3: Install and Configure Nginx on EC2

**SSH into your EC2 instance:**

```bash
ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Install Nginx:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```

---

### Step 4: Deploy Frontend Files

**Copy build files to Nginx web root:**

```bash
# Remove default Nginx files
sudo rm -rf /var/www/html/*

# Copy your build files
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

---

### Step 5: Configure Nginx for React Router

**Edit Nginx configuration:**

```bash
sudo nano /etc/nginx/sites-available/default
```

**Replace the entire content with:**

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    # Serve React Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to FastAPI backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Direct backend access (if needed)
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
    }
}
```

**Test and reload Nginx:**

```bash
# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

### Step 6: Update Frontend Environment Variables

**Important:** Your frontend `.env` should point to the correct backend URL.

**For production deployment, update `d:\Downloads\CRM\frontend\.env`:**

```env
REACT_APP_BACKEND_URL=http://YOUR_EC2_PUBLIC_IP:8000
```

**OR** if using Nginx proxy (recommended):

```env
REACT_APP_BACKEND_URL=/api
```

**After changing `.env`, rebuild and re-upload:**

```powershell
# Rebuild
$env:CI='false'; npm run build

# Re-upload to EC2
scp -i $KEY_PATH -r d:\Downloads\CRM\frontend\build\* ubuntu@${EC2_IP}:/home/ubuntu/frontend-build/

# On EC2, update files
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/
```

---

### Step 7: Verify Deployment

**Check services are running:**

```bash
# Check Nginx
sudo systemctl status nginx

# Check if backend is running on port 8000
sudo netstat -tlnp | grep 8000

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Test in browser:**
1. Frontend: `http://YOUR_EC2_PUBLIC_IP`
2. Backend API: `http://YOUR_EC2_PUBLIC_IP:8000/docs` (if port 8000 is open)
3. Backend via Nginx: `http://YOUR_EC2_PUBLIC_IP/api/docs`

---

## 🔧 Troubleshooting

### Frontend shows blank page
```bash
# Check if files exist
ls -la /var/www/html/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
```

### API calls failing
```bash
# Check backend is running
curl http://localhost:8000/docs

# Check Nginx proxy configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### React Router not working (404 on refresh)
- Ensure `try_files $uri $uri/ /index.html;` is in Nginx config
- Reload Nginx: `sudo systemctl reload nginx`

---

## 🔄 Updating the Application

**When you make changes to the frontend:**

```powershell
# On local machine
cd d:\Downloads\CRM\frontend

# Make your changes, then rebuild
$env:CI='false'; npm run build

# Upload to EC2
scp -i $KEY_PATH -r d:\Downloads\CRM\frontend\build\* ubuntu@${EC2_IP}:/home/ubuntu/frontend-build/
```

**On EC2:**
```bash
# Update web files
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/

# Clear browser cache or do hard refresh (Ctrl+Shift+R)
```

---

## 📊 EC2 Security Group Configuration

Ensure your EC2 Security Group has these inbound rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Frontend access |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 | Backend API (optional) |

---

## ✅ Deployment Checklist

- [x] Build frontend locally with `CI=false npm run build`
- [ ] Upload build folder to EC2 at `/home/ubuntu/frontend-build`
- [ ] Install Nginx on EC2
- [ ] Copy build files to `/var/www/html`
- [ ] Configure Nginx with React Router support
- [ ] Update backend CORS to allow EC2 IP
- [ ] Test frontend at `http://YOUR_EC2_IP`
- [ ] Test API calls work correctly
- [ ] Verify React Router works on page refresh

---

## 🎯 Next Steps

1. **SSL Certificate**: Set up HTTPS using Let's Encrypt
2. **Domain Name**: Point your domain to EC2 IP
3. **Monitoring**: Set up CloudWatch or other monitoring
4. **Backups**: Configure automated backups for your database
5. **CI/CD**: Automate deployment with GitHub Actions

---

## 📝 Notes

- **No Docker**: This deployment does not use Docker
- **Memory Efficient**: Building locally avoids EC2 memory issues
- **ESLint Warnings**: Ignored using `CI=false` flag
- **Production Ready**: Optimized build with code splitting and minification
