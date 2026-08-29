@echo off
echo Starting Formora AI Server in background...
powershell -WindowStyle Hidden -ExecutionPolicy Bypass -Command "Set-Location '%~dp0Backend'; node server.js"
timeout /t 2 >nul
powershell -Command "$conn = Test-NetConnection -ComputerName localhost -Port 8787 -WarningAction SilentlyContinue; if ($conn.TcpTestSucceeded) { Write-Host 'Formora AI Server is successfully running on http://localhost:8787' -ForegroundColor Green } else { Write-Host 'Failed to verify server on port 8787' -ForegroundColor Red }"
pause
