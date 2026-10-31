@echo off
rem Regenera Guia_de_uso.pdf e Informe.pdf (en la carpeta principal) a partir de los HTML de esta carpeta.
rem Uselo despues de editar guia-de-uso.html o informe.html (por ejemplo, para escribir los nombres de los integrantes).
setlocal
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%EDGE%" (
  echo No se encontro Microsoft Edge ni Google Chrome.
  pause
  exit /b 1
)
set "AQUI=%~dp0"
set "RAIZ=%~dp0..\.."
"%EDGE%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%RAIZ%\Guia_de_uso.pdf" "%AQUI%guia-de-uso.html"
"%EDGE%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%RAIZ%\Informe.pdf" "%AQUI%informe.html"
echo Listo: Guia_de_uso.pdf e Informe.pdf generados en la carpeta principal.
