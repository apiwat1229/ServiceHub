# Download winCodeSign and extract without symlinks
$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
$url = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
$zipFile = "$cacheDir\winCodeSign.7z"
$extractDir = "$cacheDir\winCodeSign-2.6.0"

# Create cache directory
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

# Download if not exists
if (-not (Test-Path $zipFile)) {
    Write-Host "Downloading winCodeSign..."
    Invoke-WebRequest -Uri $url -OutFile $zipFile
}

# Extract without symlinks (skip darwin folder entirely)
Write-Host "Extracting winCodeSign (skipping symlinks)..."
& "C:\Program Files\7-Zip\7z.exe" x -y $zipFile "-o$extractDir" -x!darwin

Write-Host "Done! Now run: npm run build:win"
