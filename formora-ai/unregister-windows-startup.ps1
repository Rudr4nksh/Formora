# Unregister Formora AI Server from Windows Startup
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "Formora-AI-Server.lnk"

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Removed Formora AI Server from Windows Startup." -ForegroundColor Yellow
} else {
    Write-Host "Startup shortcut not found: Formora AI Server was not registered in Startup." -ForegroundColor Gray
}
