@echo off
cd /d %~dp0server

echo Using portable Node...
"%~dp0node\node.exe" -v

echo Cleaning...
rmdir /s /q node_modules
del package-lock.json

echo Installing dependencies...
"%~dp0node\npm.cmd" install --build-from-source

echo Running server...
"%~dp0node\node.exe" server.js