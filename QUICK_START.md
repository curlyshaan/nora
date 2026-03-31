# 🚀 Quick Start Guide - Nora & SRP

## ✅ Nora - AI Investing Assistant (RUNNING)

### Status:
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:5173
- ✅ Browser: Opened automatically

### Current API Usage:
- **Tavily**: 5/1000 searches (1%)
- **Tradier**: 0/120,000 calls (0%)

### Features to Test:
1. **Authentication**: Register/Login with Face ID/Touch ID
2. **Chat**: Ask investing questions
3. **Web Search**: Try "what is time in India" or "latest TSLA news"
4. **Stock Quotes**: Ask "what's AAPL stock price?"
5. **Charts**: Ask "show me RSI chart" (should render interactive chart)
6. **Model Selection**: Switch between Opus, Sonnet, Haiku
7. **Dark Mode**: Toggle theme in sidebar
8. **Profile**: Set investment goals, risk tolerance

### Email Alerts:
- ✅ Configured: shanoorsai@gmail.com
- ✅ Usage alerts at 90% threshold
- ✅ Error alerts on API failures

---

## 📊 StockResearchPro (SRP) - Desktop App

### How to Start:
```bash
cd /Users/sshanoor/ClaudeProjects/StockResearchPro/AppFiles
./start.sh
```

Or manually:
```bash
cd /Users/sshanoor/ClaudeProjects/StockResearchPro/AppFiles
source venv/bin/activate
python app.py
```

Then open: http://localhost:5000

### Features:
1. **Stock Research**: Generate comprehensive DOCX reports
2. **Intent-Based**: Buy Long, Buy Short, Short Long, Short Short
3. **Options Analysis**: Greeks, IV, strike recommendations
4. **News Integration**: Tavily-powered news search
5. **Batch Processing**: Multiple tickers at once

### Email Alerts:
- ✅ Configured: shanoorsai@gmail.com
- ✅ Error alerts on API failures (Tradier, Tavily)
- ✅ 1-hour suppression to prevent spam

---

## 🔧 Restart Commands

### Nora:
```bash
cd /Users/sshanoor/ClaudeProjects/Nora

# Kill existing processes
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
node server/index.js > server.log 2>&1 &

# Start frontend
cd client && npm run dev &

# Open browser
open http://localhost:5173
```

### SRP:
```bash
cd /Users/sshanoor/ClaudeProjects/StockResearchPro/AppFiles
./start.sh
```

---

## 📧 Email Alert Testing

### Trigger Usage Alert (Nora):
The system tracks usage automatically. When you reach 900/1000 Tavily searches or 100,000/120,000 Tradier calls, you'll get an email.

### Trigger Error Alert (Both Apps):
If an API returns 429 (rate limit) or 403 (forbidden), you'll immediately get an email like:

```
Subject: 🚨 Nora API Error - Tradier

Error: Rate limit exceeded (429)
Time: 2026-03-31 12:34:56

This usually means:
- API rate limit exceeded
- Monthly quota reached
- API key invalid or expired
```

---

## 🎯 What's New

### Nora:
- ✅ Replaced Finnhub with Tradier (better API)
- ✅ Fixed chart rendering (RSI, MACD, etc.)
- ✅ Improved streaming reliability (no more hanging)
- ✅ Better error handling with timeouts
- ✅ Email alerts for API errors

### SRP:
- ✅ Added email alert system
- ✅ API error detection for Tradier & Tavily
- ✅ Same email as Nora (shanoorsai@gmail.com)

---

## 📊 Check API Usage

### Nora:
```bash
curl http://localhost:3001/api/usage-stats | python3 -m json.tool
```

### SRP:
Check console output when running reports - errors will trigger email alerts.

---

## 🐛 Troubleshooting

### Nora won't start:
```bash
# Check if ports are in use
lsof -ti:3001
lsof -ti:5173

# Kill and restart
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
cd /Users/sshanoor/ClaudeProjects/Nora
node server/index.js &
cd client && npm run dev &
```

### SRP won't start:
```bash
cd /Users/sshanoor/ClaudeProjects/StockResearchPro/AppFiles
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Email alerts not working:
Check Gmail app password is correct in `.env` files:
- Nora: `/Users/sshanoor/ClaudeProjects/Nora/.env`
- SRP: Uses hardcoded credentials in `usageTracking.py`

---

## 📝 Notes

- **Nora**: Best for mobile use (iPhone), runs 24/7 on server
- **SRP**: Desktop app, run locally when needed
- **Shared Tradier Key**: Both apps share 120k calls/month
- **Separate Tavily Keys**: Each app has its own 1k searches/month
- **Email Alerts**: Work across both apps automatically

---

## 🎉 Ready to Use!

Nora is already running at: http://localhost:5173

Try asking:
- "What's the current TSLA stock price?"
- "Show me an RSI chart"
- "What is the time in India?"
- "Explain what a P/E ratio is"
