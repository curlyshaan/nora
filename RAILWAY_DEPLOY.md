# 🚀 Railway Deployment Guide - Nora

## Quick Deploy (5 minutes)

### Step 1: Add PostgreSQL Database
1. Go to your Railway project: https://railway.app/project/6da52f0e-6a52-4627-83c4-e94df61752a9
2. Click "+ New" → "Database" → "PostgreSQL"
3. Wait for it to provision (30 seconds)

### Step 2: Create Backend Service
1. Click "+ New" → "Empty Service"
2. Name it "nora-backend"
3. Go to Settings → Source
4. Click "Connect Repo" or "Deploy from Local"
5. If local: Use Railway CLI or upload via GitHub

### Step 3: Set Environment Variables (Backend)
Go to nora-backend → Variables → Add these:

```
QUATARLY_API_KEY=qua-13iwudxg7brvd4quvuofuockowsmj4cl
QUATARLY_BASE_URL=https://api.quatarly.cloud/
NODE_ENV=production
PORT=3001
SESSION_SECRET=nora-production-secret-change-this
RP_NAME=Nora
RP_ID=nora-production.up.railway.app
ORIGIN=https://nora-frontend-production.up.railway.app
TRADIER_API_KEY=NzqeofwwmWK94Adi2E9rghG33mKZ
TRADIER_MONTHLY_LIMIT=120000
TRADIER_ALERT_THRESHOLD=100000
TAVILY_API_KEY=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
TAVILY_MONTHLY_LIMIT=1000
TAVILY_ALERT_THRESHOLD=900
EMAIL_USER=shanoorsai@gmail.com
EMAIL_PASS=vhatxgdcnzrcyile
ALERT_EMAIL=shanoorsai@gmail.com
```

**IMPORTANT:** Add DATABASE_URL from PostgreSQL:
1. Click on PostgreSQL service
2. Go to Variables tab
3. Copy the `DATABASE_URL` value
4. Add it to nora-backend variables

### Step 4: Build Frontend
```bash
cd /Users/sshanoor/ClaudeProjects/Nora/client
npm run build
```

This creates `/client/dist` folder with static files.

### Step 5: Update Backend to Serve Frontend
The backend is already configured to serve static files from `client/dist` in production mode.

### Step 6: Deploy Backend
1. In Railway, go to nora-backend service
2. Settings → Deploy
3. Upload the entire `/Users/sshanoor/ClaudeProjects/Nora` folder
4. Railway will automatically:
   - Install dependencies (`npm install`)
   - Run `node server/index.js`
   - Serve frontend from `client/dist`

### Step 7: Get Your URL
1. Go to nora-backend → Settings
2. Click "Generate Domain"
3. You'll get something like: `nora-backend-production.up.railway.app`
4. This is your app URL!

### Step 8: Update Environment Variables
Update these with your actual Railway domain:
- `RP_ID` = your Railway domain (without https://)
- `ORIGIN` = your Railway domain (with https://)

---

## Alternative: GitHub Deploy (Recommended)

### Step 1: Create GitHub Repo
```bash
cd /Users/sshanoor/ClaudeProjects/Nora
git init
git add .
git commit -m "Initial commit - Nora AI Investing Assistant"
```

Create repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/nora.git
git push -u origin main
```

### Step 2: Connect to Railway
1. Go to Railway project
2. Click "+ New" → "GitHub Repo"
3. Select your Nora repo
4. Railway auto-deploys!

### Step 3: Add Environment Variables
Same as above - add all env vars in Railway dashboard.

---

## Testing

Once deployed:
1. Visit your Railway URL
2. Register with Face ID/Touch ID
3. Test on iPhone!

---

## Troubleshooting

### Database Connection Error
- Make sure `DATABASE_URL` is set correctly
- Check PostgreSQL service is running

### Frontend Not Loading
- Make sure you ran `npm run build` in client folder
- Check `NODE_ENV=production` is set

### CORS Errors
- Update `ORIGIN` env var to match your Railway domain
- Update `RP_ID` to match domain (without https://)

---

## Files Created for Deployment
- ✅ `railway.json` - Railway configuration
- ✅ `Procfile` - Start command
- ✅ Backend already serves static files in production

**You're ready to deploy! Follow the steps above when you're back from break.** 🚀
