$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logPath = Join-Path $projectRoot ("next-start-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

& (Join-Path $PSScriptRoot "stop-next.ps1")

$command = "Set-Location '$projectRoot'; `$env:Path='C:\Program Files\nodejs;' + `$env:Path; & 'C:\Program Files\nodejs\npm.cmd' run start *> '$logPath'"

Start-Process `
  -WindowStyle Hidden `
  -FilePath "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe" `
  -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command

Start-Sleep -Seconds 3

Write-Host "Next preview started at http://localhost:3000"
Write-Host "Log: $logPath"

exit 0
