# Upload Frontend Build to EC2
# Run this script from your LOCAL Windows machine

# ========================================
# CONFIGURATION - UPDATE THESE VALUES
# ========================================

$EC2_IP = "51.21.168.20"
$KEY_PATH = "C:\Users\Admin\Downloads\crm-front.pem"
$BUILD_PATH = "d:\Downloads\CRM\frontend\build"
$AUTO_DEPLOY = $true

# ========================================
# DO NOT EDIT BELOW THIS LINE
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Build Upload Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if ($EC2_IP -eq "YOUR_EC2_PUBLIC_IP") {
    Write-Host "❌ ERROR: Please update EC2_IP in this script" -ForegroundColor Red
    exit 1
}

if ($KEY_PATH -eq "C:\path\to\your-key.pem") {
    Write-Host "❌ ERROR: Please update KEY_PATH in this script" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ ERROR: SSH key not found at: $KEY_PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $BUILD_PATH)) {
    Write-Host "❌ ERROR: Build folder not found at: $BUILD_PATH" -ForegroundColor Red
    Write-Host "   Run 'npm run build' first!" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "   EC2 IP: $EC2_IP"
Write-Host "   SSH Key: $KEY_PATH"
Write-Host "   Build Path: $BUILD_PATH"
Write-Host ""

# Upload build folder
Write-Host "📤 Uploading build folder to EC2..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

try {
    # SSH Options to avoid prompts
    $SSH_OPTS = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

    # Create directory on EC2 if it doesn't exist
    cmd /c ssh -i "$KEY_PATH" $SSH_OPTS ubuntu@$EC2_IP "mkdir -p /home/ubuntu/frontend-build"
    
    # Upload files using SCP
    # Using cmd /c strategies to handle path quoting better in some PS environments
    cmd /c scp -i "$KEY_PATH" $SSH_OPTS -r "$BUILD_PATH\*" "ubuntu@${EC2_IP}:/home/ubuntu/frontend-build/"
    
    Write-Host ""
    Write-Host "✅ Upload complete!" -ForegroundColor Green
    Write-Host ""
    
    if ($AUTO_DEPLOY) {
        Write-Host ""
        Write-Host "🚀 Deploying to Nginx..." -ForegroundColor Yellow
        
        # Upload deployment script
        cmd /c scp -i "$KEY_PATH" $SSH_OPTS "d:\Downloads\CRM\deploy-frontend.sh" "ubuntu@${EC2_IP}:/home/ubuntu/"
        
        # Make it executable and run it
        cmd /c ssh -i "$KEY_PATH" $SSH_OPTS ubuntu@$EC2_IP "chmod +x /home/ubuntu/deploy-frontend.sh && /home/ubuntu/deploy-frontend.sh"
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "✅ Deployment Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Your frontend is now available at:" -ForegroundColor Green
        Write-Host "   http://$EC2_IP" -ForegroundColor Cyan
        Write-Host ""
    }
    else {
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. SSH into EC2: ssh -i '$KEY_PATH' ubuntu@$EC2_IP"
        Write-Host "   2. Run deployment script: bash /home/ubuntu/deploy-frontend.sh"
        Write-Host ""
    }
    
}
catch {
    Write-Host ""
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check EC2 IP is correct"
    Write-Host "   2. Verify SSH key permissions"
    Write-Host "   3. Ensure EC2 security group allows SSH (port 22)"
    Write-Host ""
    exit 1
}
