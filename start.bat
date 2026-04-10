@echo off
setlocal
set REPO=%~dp0
echo =================================================
echo    Repo Scaffold - Single Command Start
echo =================================================
echo.
echo [1/3] Canvas Editor  ^-^> http://localhost:3000
start "Canvas Editor :3000" cmd /k "cd /d "%REPO%canvas-editor" && npm run dev"
echo [2/3] Generated Site ^-^> http://localhost:3001
start "Generated Site :3001" cmd /k "cd /d "%REPO%generated-site" && npm run dev -- -p 3001"
echo [3/3] Waiting for servers to start (6s)...
timeout /t 6 /nobreak > nul
echo Opening UI Editor in browser...
start http://localhost:3000
echo.
echo [agent] Starting interactive REPL below.
echo         Type a prompt to generate or modify UI.
echo -------------------------------------------------
cd /d "%REPO%repo-sandbox-agent"
node index.js
