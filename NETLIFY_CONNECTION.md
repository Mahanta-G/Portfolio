# ✅ Connect GitHub to Netlify - Quick Steps

## 🎉 Your code is on GitHub!

Your portfolio is now live at: https://github.com/Mahanta-G/Portfolio.git

## Connect to Netlify (2 minutes)

### Step 1: Go to Netlify
1. Visit https://app.netlify.com
2. Sign in (or create account with GitHub)

### Step 2: Import Your Repository
1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"GitHub"**
3. Authorize Netlify (if asked)
4. Select your repository: **`Mahanta-G/Portfolio`**

### Step 3: Configure Build Settings
**⚠️ IMPORTANT - Use these exact settings:**

- **Branch to deploy:** `main` ✅
- **Build command:** **LEAVE EMPTY** ⚠️ (don't type anything)
- **Publish directory:** `.` (just a dot) ✅

### Step 4: Deploy
Click **"Deploy site"**

Wait ~30-60 seconds and your site will be live! 🚀

## 🎯 Your Live Site URL

After deployment, Netlify will give you a URL like:
- `random-name-123.netlify.app`

### Customize the URL:
1. Go to **Site settings** → **Domain management**
2. Click **"Change site name"**
3. Enter: `gaurab-mahanta-portfolio` (or your choice)
4. Your site: `https://gaurab-mahanta-portfolio.netlify.app`

## 🔄 From Now On - Automatic Deployment!

Every time you make changes:

1. **Edit files in Cursor**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
3. **Netlify auto-deploys!** 
   - Check Netlify dashboard → Deploys tab
   - Your site updates in ~30 seconds! ✨

## 📝 Quick Git Commands Reference

```bash
# See what changed
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub (triggers Netlify deploy)
git push
```

## ✅ Done!

Your workflow is now:
**Cursor → Git → GitHub → Netlify (Auto-Deploy)** 🎉

Enjoy your automated deployment!

