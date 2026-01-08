@echo off
echo ========================================
echo Fixing Dependencies and Prisma After Restore
echo ========================================
echo.

echo [1/2] Installing missing npm packages...
call npm install uuid jsbarcode papaparse vue3-apexcharts vue-pdf-embed
if errorlevel 1 (
    echo ERROR: Failed to install packages
    pause
    exit /b 1
)
echo.

echo [2/2] Generating Prisma Client...
call npx prisma generate --schema=packages/database/prisma/schema.prisma
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo ========================================
echo Done! Restart your dev server now.
echo ========================================
echo.
echo Run: npm run dev:web
echo.
pause
