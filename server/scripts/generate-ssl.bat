@echo off
cd /d %~dp0\..

if not exist certs mkdir certs

openssl req -x509 -newkey rsa:4096 ^
  -keyout certs\server.key ^
  -out certs\server.crt ^
  -days 3650 ^
  -nodes ^
  -subj "/C=IN/ST=Local/L=Clinic/O=ClinicSystem/OU=Server/CN=localhost"

echo.
echo ✅ SSL certificate generated
pause
