@echo off
echo Starting CypherVerse Hackathon Project...
echo.
echo Frontend will be at: http://localhost:5173/
echo Backend will be at:  http://localhost:3001/
echo.
echo Cleaning up background ports...
call npx -y kill-port 3001
call npx -y kill-port 5173
echo.
set DATABASE_URL=%~dp0sqlite.db
call pnpm --filter @workspace/db run push
call pnpm run dev
pause
