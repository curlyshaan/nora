# API Tracking & Email Alerts - Implementation Summary

## Overview
Both **Nora** and **StockResearchPro (SRP)** now have comprehensive API usage tracking and email alerts.

---

## ✅ Nora - AI Investing Assistant

### APIs Used:
1. **Tradier** - Stock quotes, market data (replaced Finnhub)
   - Limit: 120,000 calls/month
   - Alert at: 100,000 calls (83%)
   
2. **Tavily** - Web search for news and current events
   - Limit: 1,000 searches/month
   - Alert at: 900 searches (90%)

3. **Quatarly** - Claude AI API (no tracking needed)

### Email Alerts:
- **Usage Alerts**: Sent when API usage reaches 90% threshold (once per day)
- **Error Alerts**: Sent immediately when API returns error (rate limit, quota exceeded, 429/403 status)
- **Email**: shanoorsai@gmail.com
- **Suppression**: Max 1 alert per API per hour to avoid spam

### Files Modified:
- `/server/.env` - Added Tradier API key and limits
- `/server/quatarly.js` - Replaced Finnhub with Tradier
- `/server/usageTracking.js` - Added Tradier tracking
- `/server/index.js` - Updated usage stats endpoint

### How It Works:
1. Every API call increments usage counter in PostgreSQL
2. When threshold reached, email alert sent once per day
3. When API returns error (429, 403, limit exceeded), immediate email alert
4. Alerts suppressed for 1 hour to prevent spam

---

## ✅ StockResearchPro (SRP) - Stock Research Tool

### APIs Used:
1. **Tradier** - Stock quotes, historical data, options chains
   - Limit: 120,000 calls/month (same key as Nora)
   - Alert at: 100,000 calls (83%)
   
2. **Tavily** - News search for stocks
   - Limit: 1,000 searches/month (different key than Nora)
   - Alert at: 900 searches (90%)

3. **Quatarly/Anthropic** - Claude AI for report generation (no tracking needed)

### Email Alerts:
- **Error Alerts**: Sent when API returns error (rate limit, quota exceeded, 429/403 status)
- **Email**: shanoorsai@gmail.com
- **Suppression**: Max 1 alert per API per hour to avoid spam

### Files Created/Modified:
- `/AppFiles/usageTracking.py` - NEW: Email alert system
- `/AppFiles/app.py` - Added error detection to Tradier and Tavily calls

### How It Works:
1. Every Tradier/Tavily API call wrapped with error detection
2. If API returns error status (429, 403) or error message contains "limit/quota/exceeded", email sent
3. Alerts suppressed for 1 hour per API to prevent spam
4. No database tracking (simpler approach for desktop app)

---

## 🔑 API Keys Summary

### Shared Across Both Apps:
- **Tradier**: `NzqeofwwmWK94Adi2E9rghG33mKZ` (120k calls/month shared)
- **Email**: shanoorsai@gmail.com / vhatxgdcnzrcyile

### Separate Keys:
- **Tavily (Nora)**: `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`
- **Tavily (SRP)**: `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`

---

## 📧 Email Alert Examples

### Usage Alert (Nora only):
```
Subject: ⚠️ Nora API Usage Alert - Tavily

Your Tavily API usage is approaching the monthly limit.

Used: 920 / 1000 searches
Remaining: 80 searches
Usage: 92%

Consider reducing usage to avoid service interruption.
```

### Error Alert (Both apps):
```
Subject: 🚨 Nora API Error - Tradier

An error occurred with the Tradier API.

Error: Rate limit exceeded (429)
Time: 2026-03-31 12:34:56

This usually means:
- API rate limit exceeded
- Monthly quota reached
- API key invalid or expired
- Service temporarily unavailable

Please check your API dashboard and usage limits.
```

---

## 🎯 Why This Approach Works

### Cross-App Tracking:
- **Tradier**: Shared key means when limit hit, BOTH apps will get email alerts
- **Tavily**: Separate keys, each app tracks independently
- **Source of Truth**: API itself rejects calls when limit reached - we catch that error and alert

### No Shared Database Needed:
- Each app detects API errors independently
- Email alerts notify you regardless of which app hit the limit
- Simple, reliable, no complex infrastructure

### Spam Prevention:
- Max 1 alert per hour per API
- Prevents inbox flooding if app makes many calls quickly

---

## 🧪 Testing

### Test Nora:
1. Start server: `cd /Users/sshanoor/ClaudeProjects/Nora && node server/index.js`
2. Ask for stock quote: "What's AAPL stock price?"
3. Check usage: `curl http://localhost:3001/api/usage-stats`

### Test SRP:
1. Run app and generate a stock report
2. Check console for "📧 API error alert sent" messages
3. Verify email received at shanoorsai@gmail.com

---

## 📝 Notes

- **Tradier** is better than Finnhub for options data (which SRP needs)
- **Tradier** free tier: 120k calls/month (very generous)
- **Tavily** free tier: 1k searches/month (monitor closely)
- Email alerts use Gmail SMTP with app password (no 2FA issues)
- Alerts work even if apps are on different machines

---

## 🚀 Future Enhancements

- Add usage dashboard in Nora UI
- Weekly usage summary emails
- Predictive alerts (e.g., "At current rate, you'll hit limit in 5 days")
- SMS alerts via Twilio (if needed)
