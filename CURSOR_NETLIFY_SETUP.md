# Connecting Cursor with Netlify - Step by Step Guide

This guide will help you set up automatic deployment from Cursor to Netlify.

## Prerequisites

### Step 1: Install Git

1. **Download Git:**
   - Go to https://git-scm.com/download/win
   - Download the Windows installer
   - Run the installer (accept all defaults)

2. **Verify Installation:**
   - Open a new PowerShell or CMD window
   - Run: `git --version`
   - You should see something like `git version 2.xx.x`

### Step 2: Install GitHub CLI (Optional but Recommended)

1. Go to https://cli.github.com/
2. Download and install GitHub CLI
3. This makes it easier to create repositories

## Setup Process

### Step 3: Initialize Git in Your Project

1. **Open Terminal in Cursor:**
   - Press `Ctrl + ` (backtick) to open terminal
   - Or go to Terminal → New Terminal

2. **Initialize Git Repository:**
   ```bash
   git init
   ```

3. **Configure Git (if first time):**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

4. **Add All Files:**
   ```bash
   git add .
   ```

5. **Create First Commit:**
   ```bash
   git commit -m "Initial commit - Portfolio website"
   ```

6. **Rename Branch to Main:**
   ```bash
   git branch -M main
   ```

### Step 4: Create GitHub Repository

**Option A: Using GitHub Website (Easier)**

1. Go to https://github.com
2. Sign in or create account
3. Click the "+" icon → "New repository"
4. Repository name: `portfolio-website` (or your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"
7. Copy the repository URL (e.g., `https://github.com/yourusername/portfolio-website.git`)

**Option B: Using GitHub CLI**

```bash
gh auth login
gh repo create portfolio-website --public
```

### Step 5: Connect Local Project to GitHub

1. **Add GitHub as Remote:**
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/portfolio-website.git
   ```
   (Replace YOUR-USERNAME with your GitHub username)

2. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

   - You may be asked to authenticate:
     - GitHub username
     - Personal Access Token (see Step 6 below)

### Step 6: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: `Netlify Deploy`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing to GitHub

### Step 7: Connect GitHub to Netlify

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Sign in or create account

2. **Import Your Repository:**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" (or "GitLab"/"Bitbucket")
   - Authorize Netlify (click "Authorize Netlify")
   - Select your repository: `portfolio-website`

3. **Configure Build Settings:**
   - **Build command:** Leave EMPTY ⚠️
   - **Publish directory:** `.` (just a dot)
   - Click "Deploy site"

4. **Wait for First Deployment:**
   - Netlify will deploy your site
   - You'll see a URL like `random-name-123.netlify.app`

### Step 8: Test Automatic Deployment

1. **Make a Small Change in Cursor:**
   - Open any HTML file (e.g., `index.html`)
   - Change something small (e.g., add a comment)

2. **Commit and Push:**
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push
   ```

3. **Watch Netlify:**
   - Go to your Netlify dashboard
   - You should see a new deployment start automatically!
   - Wait 30-60 seconds
   - Your changes will be live! 🎉

## Workflow from Now On

### Every Time You Make Changes:

1. **Make changes in Cursor** (edit files)

2. **Stage changes:**
   ```bash
   git add .
   ```

3. **Commit changes:**
   ```bash
   git commit -m "Description of changes"
   ```

4. **Push to GitHub:**
   ```bash
   git push
   ```

5. **Netlify auto-deploys!** 
   - Check Netlify dashboard → Deploys tab
   - Your site updates in ~30-60 seconds

## Customizing Your Site URL

1. Go to Netlify dashboard
2. Site settings → Domain management
3. Click "Change site name"
4. Enter your desired name (e.g., `gaurab-portfolio`)
5. Your site: `https://gaurab-portfolio.netlify.app`

## Troubleshooting

### Git Not Recognized:
- Make sure Git is installed
- Restart Cursor after installing Git
- Check PATH environment variable

### Authentication Failed:
- Use Personal Access Token, not password
- Token needs `repo` scope

### Netlify Build Failed:
- Check build settings:
  - Build command: **EMPTY**
  - Publish directory: `.`

### Changes Not Appearing:
- Wait 30-60 seconds for deployment
- Check Netlify deploy logs for errors
- Clear browser cache (Ctrl+F5)

## Quick Commands Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# View commit history
git log
```

## Next Steps

✅ Your site is now connected!
✅ Every `git push` → Auto-deploy to Netlify
✅ Make changes in Cursor → Push → Live site updates!

Enjoy your automated deployment workflow! 🚀

