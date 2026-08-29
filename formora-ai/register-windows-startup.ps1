# Register Formora AI Server to run on Windows Startup silently
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "Formora-AI-Server.lnk"
$backendDir = Join-Path $PSScriptRoot "Backend"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -Command `"Set-Location '$backendDir'; node server.js`""
$Shortcut.WorkingDirectory = $backendDir
$Shortcut.Description = "Formora AI Backend Server"
$Shortcut.Save()

Write-Host "Success: Formora AI Server registered to start automatically on Windows boot!" -ForegroundColor Green
Write-Host "Startup Shortcut Created at: $shortcutPath" -ForegroundColor Cyan
