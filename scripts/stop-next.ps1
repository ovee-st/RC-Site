$ErrorActionPreference = "SilentlyContinue"

# Windows often keeps the old Next production server alive while a new build
# rewrites .next/static. Stop only the process bound to the preview port so
# we do not kill the npm process that invoked this script.
$port = 3000
$pids = netstat -ano |
  Select-String -Pattern "LISTENING" |
  Where-Object { $_.Line -match "[:.]$port\s" } |
  ForEach-Object {
    ($_ -split "\s+")[-1]
  } |
  Sort-Object -Unique

foreach ($processId in $pids) {
  if ($processId -and $processId -ne $PID) {
    Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
  }
}

Start-Sleep -Seconds 1
