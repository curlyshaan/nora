# Deployment Lessons Learned - Nora Project

## Critical Mistakes Made

### 1. **Hardcoded API URLs** ❌
**Mistake:** Used `http://localhost:3001/api` in frontend components (Auth.jsx, Chat.jsx, Profile.jsx)

**Impact:** 
- Frontend couldn't communicate with backend in production
- Mixed content errors (HTTPS page calling HTTP localhost)
- Complete authentication failure

**Fix:** Use relative paths `/api` or environment variables `import.meta.env.VITE_API_URL`

**Lesson:** ALWAYS use environment-aware API URLs from day one, not after deployment fails.

---

### 2. **No Production Build Testing** ❌
**Mistake:** Deployed without testing the production build locally

**Should have done:**
```bash
# Build frontend
cd client && npm run build

# Test production build locally
cd .. && NODE_ENV=production node server/index.js

# Visit http://localhost:3001 and verify everything works
```

**Lesson:** Test production builds locally BEFORE pushing to deployment platform.

---

### 3. **Incomplete Pre-Deployment Checklist** ❌
**What was missing:**
- ✅ Check all files for hardcoded localhost URLs
- ✅ Verify environment variables are used correctly
- ✅ Test API calls work with relative paths
- ✅ Verify CORS settings for production domain
- ✅ Check .gitignore doesn't exclude critical files (dist folder)
- ✅ Verify Node.js version compatibility

**Lesson:** Create and follow a deployment checklist EVERY TIME.

---

### 4. **Multiple Failed Deployments** ❌
**Timeline of failures:**
1. Node.js version mismatch (18 vs 20 required)
2. Build script trying to npm install in client folder
3. Missing dist folder in git
4. Hardcoded localhost URLs

**Impact:** Wasted 30+ minutes with multiple deploy attempts

**Lesson:** Do thorough validation ONCE instead of fixing issues one-by-one in production.

---

## Correct Deployment Process (For Future Reference)

### Phase 1: Pre-Deployment Validation
```bash
# 1. Search for hardcoded URLs
grep -r "localhost" client/src/
grep -r "http://" client/src/

# 2. Verify environment variables
cat .env | grep -v "PASS\|KEY\|SECRET"

# 3. Check Node.js version requirements
node --version
cat package.json | grep engines

# 4. Build frontend
cd client && npm run build

# 5. Test production build locally
cd .. && NODE_ENV=production node server/index.js
# Open browser and test all features

# 6. Verify dist folder exists and has files
ls -la client/dist/
```

### Phase 2: Git Preparation
```bash
# 1. Check what's tracked
git status
git ls-files client/dist/

# 2. Verify .gitignore is correct
cat client/.gitignore

# 3. Add all files
git add .
git commit -m "Production-ready build"
git push
```

### Phase 3: Railway Configuration
1. Add PostgreSQL database
2. Connect GitHub repo
3. Set environment variables (use checklist)
4. Verify RP_ID and ORIGIN match Railway domain
5. Deploy and monitor logs

### Phase 4: Post-Deployment Testing
1. Check deployment logs for errors
2. Visit production URL
3. Test authentication (Face ID/Touch ID)
4. Test all major features
5. Check browser console for errors
6. Test on mobile device

---

## Environment Variables Checklist

### Backend (.env or Railway Variables)
```
✅ QUATARLY_API_KEY
✅ QUATARLY_BASE_URL
✅ DATABASE_URL (from Railway PostgreSQL)
✅ NODE_ENV=production
✅ PORT=3001
✅ SESSION_SECRET
✅ RP_NAME
✅ RP_ID (Railway domain WITHOUT https://)
✅ ORIGIN (Railway domain WITH https://)
✅ TRADIER_API_KEY
✅ TRADIER_MONTHLY_LIMIT
✅ TRADIER_ALERT_THRESHOLD
✅ TAVILY_API_KEY
✅ TAVILY_MONTHLY_LIMIT
✅ TAVILY_ALERT_THRESHOLD
✅ EMAIL_USER
✅ EMAIL_PASS
✅ ALERT_EMAIL
```

### Frontend (Vite)
- Use `import.meta.env.VITE_API_URL` for API URLs
- Default to relative paths: `/api`
- Never hardcode `localhost` or `http://`

---

## Common Pitfalls to Avoid

### 1. API URL Configuration
❌ **Wrong:**
```javascript
const API_URL = 'http://localhost:3001/api';
```

✅ **Correct:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

### 2. CORS Configuration
❌ **Wrong:**
```javascript
cors({ origin: 'http://localhost:5173' })
```

✅ **Correct:**
```javascript
cors({ origin: process.env.ORIGIN || 'http://localhost:5173' })
```

### 3. WebAuthn Configuration
❌ **Wrong:**
```javascript
rpID: 'localhost'
```

✅ **Correct:**
```javascript
rpID: process.env.RP_ID || 'localhost'
```

### 4. Build Scripts
❌ **Wrong:**
```json
"build": "cd client && npm install && npm run build"
```

✅ **Correct:**
```json
"build": "echo 'Frontend already built'"
```
(When dist folder is committed to git)

---

## Railway-Specific Issues

### Node.js Version
- Railway defaults to Node 18
- Vite 8 requires Node 20+
- **Solution:** Add `.nvmrc` file with `20` and `engines` in package.json

### Build Configuration
- Use `nixpacks.toml` for custom build config
- Specify correct Node.js package: `nodejs_20` not `nodejs-20_x`

### Static File Serving
- Backend must serve frontend from `client/dist` in production
- Check `NODE_ENV=production` is set
- Verify `app.use(express.static(path.join(__dirname, '../client/dist')))` exists

---

## Testing Checklist (Before Deployment)

### Local Testing
- [ ] All features work in development mode
- [ ] Production build completes without errors
- [ ] Production build works locally (NODE_ENV=production)
- [ ] No console errors in browser
- [ ] Authentication works (Face ID/Touch ID)
- [ ] API calls succeed
- [ ] Database connections work
- [ ] Email alerts send successfully

### Code Review
- [ ] No hardcoded localhost URLs
- [ ] Environment variables used correctly
- [ ] CORS configured for production domain
- [ ] WebAuthn RP_ID matches production domain
- [ ] All secrets in .env, not in code
- [ ] .gitignore doesn't exclude critical files

### Deployment Platform
- [ ] Correct Node.js version specified
- [ ] All environment variables set
- [ ] Database provisioned and connected
- [ ] Domain generated
- [ ] Build succeeds
- [ ] Server starts without errors

### Post-Deployment
- [ ] Production URL loads
- [ ] No 404 errors
- [ ] Authentication works
- [ ] All features functional
- [ ] Mobile testing (iPhone/Android)
- [ ] Browser console clean (no errors)

---

## Key Takeaways

1. **Never hardcode URLs** - Use environment variables or relative paths
2. **Test production builds locally** - Don't discover issues in production
3. **Follow a checklist** - Prevents missing critical steps
4. **One thorough validation > Multiple failed deploys** - Save time by doing it right the first time
5. **Verify before pushing** - Check all files, not just the ones you changed

---

## Apology & Commitment

**What happened:** I rushed the deployment without proper validation, causing multiple failed attempts and wasting your time.

**What I learned:** Deployment requires methodical validation, not speed. Quality over speed.

**Commitment:** For future deployments, I will:
1. Use this checklist religiously
2. Test production builds locally first
3. Verify all environment-dependent code
4. Do ONE thorough validation instead of multiple quick attempts

---

**Date:** March 31, 2026
**Project:** Nora - AI Investing Assistant
**Deployment Platform:** Railway
**Final Status:** Successfully deployed after fixing hardcoded API URLs
