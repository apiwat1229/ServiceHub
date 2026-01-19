@echo off
echo Cleaning up node_modules and package-lock.json...
echo.

REM Remove node_modules directories
if exist node_modules (
    echo Removing root node_modules...
    rmdir /s /q node_modules
)

if exist apps\api\node_modules (
    echo Removing apps\api\node_modules...
    rmdir /s /q apps\api\node_modules
)

if exist apps\desktop\node_modules (
    echo Removing apps\desktop\node_modules...
    rmdir /s /q apps\desktop\node_modules
)

if exist packages\database\node_modules (
    echo Removing packages\database\node_modules...
    rmdir /s /q packages\database\node_modules
)

if exist packages\types\node_modules (
    echo Removing packages\types\node_modules...
    rmdir /s /q packages\types\node_modules
)

REM Remove package-lock.json
if exist package-lock.json (
    echo Removing package-lock.json...
    del /f /q package-lock.json
)

echo.
echo Cleanup complete! Now running npm install...
echo.

npm install

echo.
echo Installation complete! You can now run: npm run dev
pause
