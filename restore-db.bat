@echo off
echo Starting Docker containers...
docker-compose up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak

echo Restoring database from backup...
docker exec -i myapp-postgres psql -U postgres -d myapp < backups\backup-20260108-081022.sql

echo Database restoration completed!
echo.
echo Running post-restore fixes...
cd apps\desktop
call npx prisma generate
call npx prisma db push --accept-data-loss

echo.
echo All done! Database has been restored successfully.
pause
