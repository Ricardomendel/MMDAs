@echo off
echo Creating .env file for Prisma...
echo.
echo Copying env.example to .env...
copy env.example .env
echo.
echo .env file created successfully!
echo.
echo Please edit the .env file and update the following values:
echo - JWT_SECRET: Change to a secure random string
echo - SMTP_USER: Your email address
echo - SMTP_PASS: Your email app password
echo - TWILIO_ACCOUNT_SID: Your Twilio account SID
echo - TWILIO_AUTH_TOKEN: Your Twilio auth token
echo - TWILIO_PHONE_NUMBER: Your Twilio phone number
echo.
echo The DATABASE_URL is already set to your Neon database.
echo.
pause
