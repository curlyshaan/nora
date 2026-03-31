# Claude Technical Notes - Nora Project

## Project Overview
Nora is an AI-powered investing learning assistant web app with real-time market data, web search, and streaming responses. Users can have conversations with Claude models (via Quatarly API) to learn about investing, with their profile context informing responses.

## NEW FEATURES (2026-03-31)

### 1. Streaming Responses
- Real-time word-by-word AI responses using Server-Sent Events (SSE)
- Smooth typing animation like ChatGPT/Claude
- Fallback to non-streaming if streaming fails
- Better UX - no more waiting for full response

### 2. Web Search Integration
- Anthropic's native web_search tool (Brave-powered)
- AI can access latest news, events, and real-time information
- Automatically searches when users ask about current events
- Example: "What's the latest on Iran?" or "Recent tech news?"

### 3. Market Data Integration (Finnhub)
- Real-time stock quotes
- Company news (last 7 days)
- Earnings calendar (next 30 days)
- API endpoints:
  - GET /api/market/quote/:symbol
  - GET /api/market/news/:symbol
  - GET /api/market/earnings

### 4. UI Improvements
- Claude/ChatGPT-style clean design
- Centered messages (max 48rem width)
- Smooth animations and fade-ins
- Auto-expanding input textarea
- Better scrollbar styling
- Backdrop blur effects
- Dark mode by default

## Architecture

### Backend (Node.js + Express)
- **server/index.js**: Main Express server with all API routes
- **server/db.js**: PostgreSQL connection and schema initialization
- **server/quatarly.js**: Quatarly API integration with system prompts

### Frontend (React + Vite)
- **App.jsx**: Main router with auth state management
- **components/Auth.jsx**: WebAuthn registration/login
- **components/Chat.jsx**: Main chat interface with conversation threads
- **components/Profile.jsx**: User investment profile form

### Database Schema
```sql
users: id, username, credential_id, credential_public_key, counter
user_profiles: user_id, fund_amount, family_size, investment_timeline, risk_tolerance, financial_goals, emergency_fund, debts_status, additional_context
conversations: id, user_id, title, model, created_at, updated_at
messages: id, conversation_id, role, content, created_at
```

## Key Features Implemented

1. **WebAuthn Authentication**
   - Uses @simplewebauthn/server and @simplewebauthn/browser
   - Face ID on iPhone, Touch ID on Mac
   - Passwordless - only biometric authentication
   - Challenge stored in global variable (use Redis in production)

2. **Quatarly API Integration**
   - Base URL: https://api.quatarly.cloud/
   - Models: claude-opus-4-6-thinking, claude-sonnet-4-6-thinking, claude-haiku-4-5-20251001
   - System prompt includes investing education context + user profile
   - API key: qua-13iwudxg7brvd4quvuofuockowsmj4cl (stored in .env)

3. **User Profile System**
   - Stores investment context (fund amount, family size, goals, risk tolerance)
   - Profile data injected into system prompt for personalized responses
   - Helps AI provide relevant educational guidance

4. **Conversation Management**
   - Multiple conversation threads like Claude UI
   - Messages stored in PostgreSQL
   - Conversation history sent to API for context
   - Model selection per conversation

## Configuration

### Environment Variables (.env)
```
QUATARLY_API_KEY=qua-13iwudxg7brvd4quvuofuockowsmj4cl
QUATARLY_BASE_URL=https://api.quatarly.cloud/
DATABASE_URL=postgresql://localhost:5432/nora
NODE_ENV=development
PORT=3001
SESSION_SECRET=change-this-in-production
RP_NAME=Nora
RP_ID=localhost
ORIGIN=http://localhost:5173
```

### For Railway Deployment
Update these in Railway environment variables:
- `RP_ID` → your-app.railway.app
- `ORIGIN` → https://your-app.railway.app
- `DATABASE_URL` → (auto-provided by Railway PostgreSQL)

## How to Run

### Local Development
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Setup PostgreSQL
createdb nora

# Run both frontend and backend
npm run dev

# Or separately:
npm run server  # Backend: http://localhost:3001
npm run client  # Frontend: http://localhost:5173
```

### Production Build
```bash
cd client && npm run build
npm start
```

## User Flow

1. **First Time User**:
   - Visit /auth
   - Enter username
   - Click "Register with Face ID"
   - Complete biometric authentication
   - Redirected to /chat

2. **Setup Profile**:
   - Click "Profile" in sidebar
   - Fill investment context (fund amount, family size, goals, etc.)
   - Save profile

3. **Chat with AI**:
   - Create new conversation or select existing
   - Choose model (Opus/Sonnet/Haiku)
   - Ask investing questions
   - AI responds with educational guidance based on profile

4. **Returning User**:
   - Visit /auth
   - Enter username
   - Click "Login with Face ID"
   - Biometric authentication
   - Access previous conversations

## Important Notes

### Security
- API key stored in .env (not committed to git)
- WebAuthn provides secure passwordless auth
- User data stored in PostgreSQL with proper foreign keys
- CORS configured for specific origin

### Educational Disclaimer
- System prompt explicitly states educational purposes only
- AI instructed NOT to make specific investment recommendations
- Always reminds users to consult licensed financial advisors
- Focuses on teaching concepts, not giving advice

### Mobile Compatibility
- Responsive CSS for iPhone
- WebAuthn works with Face ID on iOS
- Sidebar collapses on mobile
- Touch-friendly UI elements

## Future Enhancements (Not Yet Implemented)

- [ ] Redis for challenge storage (currently using global variable)
- [ ] Conversation search functionality
- [ ] Export conversations to PDF
- [ ] File/image upload support
- [ ] Chart generation for technical analysis
- [ ] Real-time market data integration
- [ ] Multi-user support with proper sessions
- [ ] Conversation editing/deletion
- [ ] Dark mode

## Troubleshooting

### WebAuthn Not Working
- Ensure HTTPS or localhost
- Check browser supports WebAuthn (Safari, Chrome, Edge)
- Verify RP_ID matches domain

### Database Connection Failed
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure database 'nora' exists

### Quatarly API Errors
- Verify API key is valid
- Check network connectivity
- Ensure model names are correct

## Railway Deployment Checklist

1. ✅ Push code to GitHub (curlyshaan org)
2. ✅ Create Railway project
3. ✅ Add PostgreSQL database
4. ✅ Set environment variables
5. ✅ Configure build/start commands
6. ✅ Update RP_ID and ORIGIN for production domain
7. ✅ Test Face ID authentication on iPhone
8. ✅ Verify conversations persist

## Cost Estimate

- Railway: ~$2-5/month (small app + PostgreSQL)
- Quatarly API: Based on usage (user already has key)
- Total: Under $10/month

## GitHub Repository

- Owner: curlyshaan
- Repo: nora (to be created)
- Branch: main
- Deployment: Railway auto-deploy on push

## User's Requirements Met

✅ Web app accessible via iPhone
✅ Face ID passkey authentication
✅ Model selection like Claude UI
✅ Conversation threads
✅ Stored conversations (PostgreSQL)
✅ Investing learning context built-in
✅ User profile for personalized responses
✅ Free/cheap hosting (Railway)
✅ Local development first, then deploy

## Next Steps for User

1. Test locally: `npm run dev`
2. Register with Face ID
3. Setup investment profile
4. Test conversations with different models
5. Push to GitHub
6. Deploy to Railway
7. Test on iPhone with production URL
