# Railway Environment Variables - Copy & Paste

## Step 1: Copy ALL of these (Cmd+A, Cmd+C)

```
QUATARLY_API_KEY=qua-13iwudxg7brvd4quvuofuockowsmj4cl
QUATARLY_BASE_URL=https://api.quatarly.cloud/
NODE_ENV=production
PORT=3001
SESSION_SECRET=nora-production-secret-2026
RP_NAME=Nora
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

## Step 2: In Railway Dashboard

1. Click on your **nora** service
2. Go to **Variables** tab
3. Click **"Raw Editor"** (top right)
4. **Paste** everything from above
5. Click **"Save"**

## Step 3: Add DATABASE_URL

1. Click on **PostgreSQL** service
2. Go to **Variables** tab
3. Find **DATABASE_URL** and copy its value
4. Go back to **nora** service → **Variables**
5. Click **"+ New Variable"**
6. Name: `DATABASE_URL`
7. Value: paste the PostgreSQL URL
8. Click **"Add"**

## Step 4: Get Your Domain

1. In **nora** service, go to **Settings**
2. Scroll to **Networking**
3. Click **"Generate Domain"**
4. Copy the domain (like `nora-production-abc123.up.railway.app`)

## Step 5: Update CORS Variables

Go back to **Variables** and add/update:

```
RP_ID=nora-production-abc123.up.railway.app
ORIGIN=https://nora-production-abc123.up.railway.app
```

(Replace with YOUR actual domain)

## Step 6: Deploy

Railway will auto-deploy when you save variables!

Wait 2-3 minutes, then visit your domain!

---

**That's it! Your app will be live!** 🚀
