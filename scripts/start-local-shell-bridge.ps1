param(
  [string]$ProjectPath = (Get-Location).Path,
  [int]$Port = 4173,
  [string]$BindHost = "127.0.0.1",
  [string]$Token = ""
)

$ErrorActionPreference = "Stop"

$bridgeScript = Join-Path $PSScriptRoot "local-shell-bridge.mjs"
if (-not (Test-Path $bridgeScript)) {
  Write-Error "Bridge script not found: $bridgeScript"
}

$env:LOCAL_SHELL_BRIDGE_CWD = $ProjectPath
$env:LOCAL_SHELL_BRIDGE_PORT = "$Port"
$env:LOCAL_SHELL_BRIDGE_HOST = $BindHost

if ($Token) {
  $env:LOCAL_SHELL_BRIDGE_TOKEN = $Token
} else {
  Remove-Item Env:LOCAL_SHELL_BRIDGE_TOKEN -ErrorAction SilentlyContinue
}

Write-Host "Starting local-shell-bridge..."
Write-Host "ProjectPath: $ProjectPath"
Write-Host "Bridge URL: http://$BindHost`:$Port"
if ($Token) {
  Write-Host "Token: enabled"
} else {
  Write-Host "Token: disabled"
}
Write-Host ""
Write-Host "Keep this terminal open while using /dev/studio."
Write-Host ""

node $bridgeScript
