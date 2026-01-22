@echo off
cd /d "c:\Users\apiwa\Desktop\Desktop-NestJS\packages\database"
call npx prisma generate
echo.
echo Prisma generation complete!
pause
