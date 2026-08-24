[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$Database,
    [Parameter(Mandatory)] [string]$OutputDirectory,
    [string]$Host = '127.0.0.1',
    [int]$Port = 3306,
    [string]$Username = 'root',
    [string]$MySqlDumpPath = 'C:\xampp\mysql\bin\mysqldump.exe'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $MySqlDumpPath -PathType Leaf)) {
    throw "mysqldump was not found at: $MySqlDumpPath"
}

if ([string]::IsNullOrWhiteSpace($Database) -or $Database -match '[^A-Za-z0-9_$-]') {
    throw 'Database must contain only letters, numbers, underscores, dollar signs, or hyphens.'
}

$resolvedOutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Path $resolvedOutputDirectory -Force | Out-Null

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $resolvedOutputDirectory "$Database-$timestamp.sql"

if (Test-Path -LiteralPath $backupPath) {
    throw "Backup already exists: $backupPath"
}

Write-Host "Creating non-destructive backup: $backupPath" -ForegroundColor Cyan
Write-Host 'mysqldump will securely prompt for the database password.' -ForegroundColor Yellow

$dumpArguments = @(
    "--host=$Host",
    "--port=$Port",
    "--user=$Username",
    '--password',
    '--single-transaction',
    '--routines',
    '--events',
    '--triggers',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    "--result-file=$backupPath",
    '--databases',
    $Database
)

& $MySqlDumpPath @dumpArguments

if ($LASTEXITCODE -ne 0) {
    throw "mysqldump failed with exit code $LASTEXITCODE. Keep the output file for inspection; do not treat it as a valid backup."
}

$backup = Get-Item -LiteralPath $backupPath
if ($backup.Length -eq 0) {
    throw "Backup completed but produced an empty file: $backupPath"
}

$hash = Get-FileHash -LiteralPath $backupPath -Algorithm SHA256
Write-Host "Backup complete: $($backup.FullName)" -ForegroundColor Green
Write-Host "Size: $($backup.Length) bytes"
Write-Host "SHA256: $($hash.Hash)"
