[CmdletBinding()]
param(
    # Keep the original App-Dev repository as the source of truth. This path
    # must be physically short because Android CMake resolves virtual drives.
    [string]$BuildRoot = 'C:\Users\jttra\LibraryApp\App-Dev',

    # Reinstall the copied mobile dependencies and regenerate Android files.
    # Use this for the first build copy or after dependency/app.json changes.
    [switch]$PrepareAndroid
)

$ErrorActionPreference = 'Stop'

$sourceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path.TrimEnd('\')
$destinationRoot = [System.IO.Path]::GetFullPath($BuildRoot).TrimEnd('\')
$sourceMobileRoot = Join-Path $sourceRoot 'mobile'
$destinationMobileRoot = Join-Path $destinationRoot 'mobile'

if ([string]::Equals($sourceRoot, $destinationRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The Android build copy cannot be the same folder as the source project.'
}

if ($destinationRoot.StartsWith("$sourceRoot\\", [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The Android build copy must be outside the source project folder.'
}

if ($destinationRoot.Length -gt 55) {
    Write-Warning "The build path is $($destinationRoot.Length) characters long. Use a shorter physical path if Android CMake reports object-path warnings."
}

if (Test-Path -LiteralPath $destinationRoot) {
    $hasMobileProject = Test-Path -LiteralPath (Join-Path $destinationRoot 'mobile\package.json')
    $hasFiles = (Get-ChildItem -LiteralPath $destinationRoot -Force | Select-Object -First 1) -ne $null

    if ($hasFiles -and -not $hasMobileProject) {
        throw "Refusing to sync into a non-project folder: $destinationRoot"
    }
} else {
    New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
}

$excludedDirectories = @(
    (Join-Path $sourceMobileRoot 'node_modules'),
    (Join-Path $sourceMobileRoot '.cxx'),
    (Join-Path $sourceMobileRoot 'dist'),
    (Join-Path $sourceMobileRoot '.expo'),
    (Join-Path $sourceMobileRoot '.idea'),
    (Join-Path $sourceMobileRoot '.npm-cache'),
    (Join-Path $sourceMobileRoot 'android\.gradle'),
    (Join-Path $sourceMobileRoot 'android\.cxx'),
    (Join-Path $sourceMobileRoot 'android\.idea'),
    (Join-Path $sourceMobileRoot 'android\.kotlin'),
    (Join-Path $sourceMobileRoot 'android\build'),
    (Join-Path $sourceMobileRoot 'android\app\.cxx'),
    (Join-Path $sourceMobileRoot 'android\app\build')
)
$excludedFiles = @(
    (Join-Path $sourceMobileRoot 'android\local.properties')
)

Write-Host "Syncing mobile source to $destinationMobileRoot"
# Do not pipe robocopy through another cmdlet: PowerShell would replace
# $LASTEXITCODE with the pipeline command's status and could falsely report a
# failed copy as successful.
& robocopy $sourceMobileRoot $destinationMobileRoot /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /XD $excludedDirectories /XF $excludedFiles
$robocopyExitCode = $LASTEXITCODE

if ($robocopyExitCode -gt 7) {
    throw "robocopy failed with exit code $robocopyExitCode. The source project was not changed."
}

Write-Host "Source sync complete (robocopy exit code $robocopyExitCode)."

if ($PrepareAndroid) {
    Push-Location $destinationMobileRoot
    try {
        Write-Host 'Installing the copied mobile dependencies...'
        & npm.cmd ci

        Write-Host 'Regenerating the copied Android project...'
        & npx.cmd expo prebuild --platform android --clean
    } finally {
        Pop-Location
    }

    Write-Host "Android build copy is ready: $(Join-Path $destinationMobileRoot 'android')"
}
