@echo off
echo 🚀 Syncing CRM project to GitHub...
git add .
set /p commit_msg="Enter commit message (or press enter for 'Auto-update'): "
if "%commit_msg%"=="" set commit_msg=Auto-update
git commit -m "%commit_msg%"
git push origin main
echo ✅ Sync Complete!
pause
