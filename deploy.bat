@echo off
echo Building project...
call npm run build:deploy

echo.
echo Entering dist directory...
cd dist

echo.
echo Initializing git repository...
git init
git checkout -b main
git add -A
git commit -m "deploy"

echo.
echo Deploying to GitHub Pages...
git push -f https://github.com/lekoon/Visorq.git main:gh-pages

cd ..

echo.
echo ========================================
echo Deployment complete!
echo Your site will be available at:
echo https://lekoon.github.io/Visorq/
echo ========================================
pause
