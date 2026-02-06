# Upload Backend to EC2
# Run this script from your LOCAL Windows machine

# ========================================
# CONFIGURATION - UPDATE THESE VALUES
# ========================================

$EC2_IP = "13.51.198.102"
$KEY_PATH = "C:\Users\Admin\Downloads\crm-backend.pem"
$BACKEND_PATH = "d:\Downloads\CRM\backend"

# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend Upload & Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($EC2_IP -eq "YOUR_NEW_BACKEND_IP") {
    Write-Host "❌ ERROR: Please update EC2_IP in this script first!" -ForegroundColor Red
    exit 1
}

# SSH Options to avoid prompts
$SSH_OPTS = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

try {
    Write-Host "📂 Creating remote directory..." -ForegroundColor Yellow
    cmd /c ssh -i "$KEY_PATH" $SSH_OPTS ubuntu@$EC2_IP "mkdir -p /home/ubuntu/crm-backend"

    Write-Host "📤 Uploading backend code..." -ForegroundColor Yellow
    # Exclude __pycache__ and venv to save time/bandwidth
    # Using a simple file copy for key files to avoid uploading garbage
    $files = @("server.py", "requirements.txt", ".env", "bid_reminder_scheduler.py", "email_service.py")
    
    foreach ($file in $files) {
        $localPath = Join-Path $BACKEND_PATH $file
        if (Test-Path $localPath) {
            Write-Host "   Uploading $file..." -ForegroundColor Gray
            cmd /c scp -i "$KEY_PATH" $SSH_OPTS "$localPath" "ubuntu@${EC2_IP}:/home/ubuntu/crm-backend/"
        }
    }
    
    # Upload directories (config, templates, etc if they exist)
    if (Test-Path "$BACKEND_PATH\templates") {
        Write-Host "   Uploading templates..." -ForegroundColor Gray
        cmd /c scp -i "$KEY_PATH" $SSH_OPTS -r "$BACKEND_PATH\templates" "ubuntu@${EC2_IP}:/home/ubuntu/crm-backend/"
    }

    Write-Host "🚀 Deploying Service..." -ForegroundColor Yellow
    # Upload deploy script
    cmd /c scp -i "$KEY_PATH" $SSH_OPTS "d:\Downloads\CRM\deploy-backend.sh" "ubuntu@${EC2_IP}:/home/ubuntu/"
    
    # Run deploy script
    cmd /c ssh -i "$KEY_PATH" $SSH_OPTS ubuntu@$EC2_IP "chmod +x /home/ubuntu/deploy-backend.sh && /home/ubuntu/deploy-backend.sh"

    Write-Host ""
    Write-Host "✅ Backend Deployment Complete!" -ForegroundColor Green
    Write-Host "Test URL: http://${EC2_IP}:8000/docs" -ForegroundColor Cyan

}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
