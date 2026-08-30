@echo off
powershell -Command "$p = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.js*' }; if ($p) { Write-Host 'Formora AI Server is RUNNING (PID:' $p.Id ')' -ForegroundColor Green } else { Write-Host 'Formora AI Server is NOT running' -ForegroundColor Yellow }; $conn = Test-NetConnection -ComputerName localhost -Port 8787 -WarningAction SilentlyContinue; if ($conn.TcpTestSucceeded) { Write-Host 'Port 8787 is ACTIVE' -ForegroundColor Green } else { Write-Host 'Port 8787 is OPEN / INACTIVE' -ForegroundColor Gray }"
pause
