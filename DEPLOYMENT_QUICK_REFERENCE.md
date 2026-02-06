# Quick Deployment Reference

## 🚀 Complete Deployment Flow

### 1️⃣ Build Frontend (Local Machine - Windows)
```powershell
cd d:\Downloads\CRM\frontend

# Clean install
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps

# Build for production
$env:CI='false'; npm run build
```

### 2️⃣ Upload to EC2 (Local Machine)
```powershell
# Edit upload-to-ec2.ps1 with your EC2 IP and key path
# Then run:
.\upload-to-ec2.ps1
```

**OR manually:**
```powershell
scp -i C:\path\to\key.pem -r d:\Downloads\CRM\frontend\build\* ubuntu@YOUR_EC2_IP:/home/ubuntu/frontend-build/
```

### 3️⃣ First-Time Setup (EC2 - One Time Only)
```bash
# Install Nginx
sudo apt update && sudo apt upgrade -y
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4️⃣ Deploy Frontend (EC2)
```bash
# Option A: Use automated script
bash /home/ubuntu/deploy-frontend.sh

# Option B: Manual deployment
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
sudo systemctl reload nginx
```

---

## 🔄 Update Workflow (After Code Changes)

### On Local Machine:
```powershell
cd d:\Downloads\CRM\frontend

# Make your changes, then:
$env:CI='false'; npm run build
.\upload-to-ec2.ps1
```

### On EC2:
```bash
bash /home/ubuntu/deploy-frontend.sh
```

---

## 🔍 Verification Commands (EC2)

```bash
# Check Nginx status
sudo systemctl status nginx

# Check backend is running
curl http://localhost:8000/docs

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🌐 Access URLs

- **Frontend**: `http://YOUR_EC2_IP`
- **Backend (direct)**: `http://YOUR_EC2_IP:8000/docs`
- **Backend (via Nginx)**: `http://YOUR_EC2_IP/api/docs`

---

## 🛠️ Troubleshooting

### Blank page / 404 errors
```bash
# Check files exist
ls -la /var/www/html/

# Check permissions
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# Check Nginx config
sudo nginx -t
sudo systemctl restart nginx
```

### API calls failing
```bash
# Check backend is running
sudo netstat -tlnp | grep 8000

# Check Nginx proxy config
sudo cat /etc/nginx/sites-available/default

# Restart services
sudo systemctl restart nginx
```

### React Router 404 on refresh
```bash
# Ensure try_files is configured
sudo nano /etc/nginx/sites-available/default

# Should have: try_files $uri $uri/ /index.html;
sudo systemctl reload nginx
```

---

## 📋 EC2 Security Group Rules

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Frontend |
| Custom TCP | 8000 | 0.0.0.0/0 | Backend API |

---

## 📝 Important Files

- **Local Build**: `d:\Downloads\CRM\frontend\build`
- **EC2 Upload Location**: `/home/ubuntu/frontend-build`
- **Nginx Web Root**: `/var/www/html`
- **Nginx Config**: `/etc/nginx/sites-available/default`
- **Nginx Logs**: `/var/log/nginx/`

---

## ⚡ Quick Commands

```bash
# Full deployment (EC2)
sudo cp -r /home/ubuntu/frontend-build/* /var/www/html/ && \
sudo chown -R www-data:www-data /var/www/html && \
sudo chmod -R 755 /var/www/html && \
sudo systemctl reload nginx

# Check everything
sudo systemctl status nginx && \
curl -I http://localhost && \
curl -I http://localhost:8000/docs

# View logs in real-time
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```
