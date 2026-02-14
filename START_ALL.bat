@echo off
TITLE Restaurante POS System Launcher

echo ===================================================
echo   INICIANDO SISTEMA RESTAURANTE POS
echo ===================================================
echo.

echo 1. Verificando MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB esta corriendo.
) else (
    echo [ALERTA] MongoDB no parece estar corriendo.
    echo Intentando iniciar MongoDB...
    echo Si esto falla, asegurate de tener MongoDB instalado y corriendo manualmente.
    if not exist "data" mkdir data
    start "MongoDB" mongod --dbpath ./data
    timeout /t 5
)

echo.
echo 2. Iniciando Backend POS (Puerto 3000)...
start "Backend POS" cmd /k "cd pos-backend && npm run dev"

echo.
echo 3. Iniciando Frontend POS...
start "Frontend POS" cmd /k "cd pos-frontend && npm run dev  -- --host"

echo.
echo ===================================================
echo   SISTEMA INICIADO
echo ===================================================
echo.
echo - Backend POS:     http://localhost:3000
echo - Frontend POS:    http://localhost:5173 (o similar)
echo.
echo Puedes cerrar esta ventana, pero NO cierres las ventanas de comandos que se abrieron.
echo.
pause
