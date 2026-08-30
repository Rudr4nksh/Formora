@echo off
echo Stopping Formora AI Server...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.js*' } | Stop-Process -Force"
echo Stopped.
pause
