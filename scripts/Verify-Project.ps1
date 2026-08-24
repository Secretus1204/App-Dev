[CmdletBinding()]
param(
    # Run clean dependency installs before verification. Omit for normal local
    # checks when Composer and npm dependencies are already installed.
    [switch]$InstallDependencies,

    # Produce the Android JavaScript bundle in addition to the TypeScript
    # check. This does not run the Android NDK/Gradle native compiler.
    [switch]$IncludeMobileBundle
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path

function Invoke-ProjectCommand {
    param(
        [Parameter(Mandatory)] [string]$WorkingDirectory,
        [Parameter(Mandatory)] [string]$Command,
        [string[]]$Arguments = @()
    )

    Push-Location $WorkingDirectory
    try {
        Write-Host "> $Command $($Arguments -join ' ')" -ForegroundColor Cyan
        & $Command @Arguments

        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
        }
    } finally {
        Pop-Location
    }
}

$backend = Join-Path $projectRoot 'backend'
$frontend = Join-Path $projectRoot 'frontend'
$mobile = Join-Path $projectRoot 'mobile'

if ($InstallDependencies) {
    Invoke-ProjectCommand -WorkingDirectory $backend -Command 'composer' -Arguments @('install', '--no-interaction', '--prefer-dist')
    Invoke-ProjectCommand -WorkingDirectory $frontend -Command 'npm.cmd' -Arguments @('ci')
    Invoke-ProjectCommand -WorkingDirectory $mobile -Command 'npm.cmd' -Arguments @('ci')
}

Invoke-ProjectCommand -WorkingDirectory $backend -Command '.\vendor\bin\pint.bat' -Arguments @('--test')
Invoke-ProjectCommand -WorkingDirectory $backend -Command 'php' -Arguments @('artisan', 'test', '--compact')
Invoke-ProjectCommand -WorkingDirectory $backend -Command 'php' -Arguments @('artisan', 'schedule:list')

Invoke-ProjectCommand -WorkingDirectory $frontend -Command 'npm.cmd' -Arguments @('run', 'typecheck')
Invoke-ProjectCommand -WorkingDirectory $frontend -Command 'npm.cmd' -Arguments @('run', 'build')

Invoke-ProjectCommand -WorkingDirectory $mobile -Command 'npm.cmd' -Arguments @('run', 'typecheck')

if ($IncludeMobileBundle) {
    Invoke-ProjectCommand -WorkingDirectory $mobile -Command 'npm.cmd' -Arguments @('run', 'export:android')
}

Write-Host 'All automated Phase 8 verification checks passed.' -ForegroundColor Green
