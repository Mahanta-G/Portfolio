# PowerShell script to set up Git repository for Netlify
# Run this script in PowerShell: .\setup.ps1

Write-Host "🚀 Setting up Git repository for Netlify deployment..." -ForegroundColor Green
Write-Host ""

# Check if Git is installed
Write-Host "Checking Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "⚠️  Git repository already exists!" -ForegroundColor Yellow
} else {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

Write-Host ""

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

Write-Host ""

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit - Portfolio website"
Write-Host "✅ Initial commit created" -ForegroundColor Green

Write-Host ""

# Rename branch to main
Write-Host "Setting branch to 'main'..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branch set to 'main'" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a repository on GitHub" -ForegroundColor White
Write-Host "2. Run: git remote add origin https://github.com/YOUR-USERNAME/portfolio-website.git" -ForegroundColor White
Write-Host "3. Run: git push -u origin main" -ForegroundColor White
Write-Host "4. Connect GitHub repo to Netlify" -ForegroundColor White
Write-Host ""
Write-Host "See CURSOR_NETLIFY_SETUP.md for detailed instructions!" -ForegroundColor Cyan


