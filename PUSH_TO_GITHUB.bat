@echo off
cd /d "%~dp0"
cls
echo ========================================================
echo   ShadowMarket - Uploading to GitHub
echo ========================================================
echo.
echo Starting git push to https://github.com/yelvyn01-web/shadowmarket ...
echo.
git push -u origin main
echo.
echo ========================================================
echo Process finished. Please check the result above.
echo If you see objects counted/written, it is completed!
echo You can now refresh your GitHub webpage.
echo ========================================================
echo.
pause
