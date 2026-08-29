Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
BackendDir = ScriptDir & "\Backend"
WshShell.Run "cmd /c ""cd /d """ & BackendDir & """ && node server.js""", 0, True









