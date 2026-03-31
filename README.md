# Nora - AI Investing Learning Assistant

Nora is a web application that helps users learn about investing through AI-powered conversations. Built with React, Node.js, and Quatarly API integration.

## Features

- 🔐 **Biometric Authentication**: Face ID / Touch ID login using WebAuthn
- 💬 **Conversation Threads**: Organize learning sessions like Claude UI
- 🤖 **Multiple AI Models**: Switch between Claude Opus, Sonnet, and Haiku
- 👤 **User Profiles**: Store investment context for personalized guidance
- 💾 **Persistent Storage**: PostgreSQL database for conversations and profiles
- 📱 **Mobile-Friendly**: Responsive design for iPhone and desktop

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: WebAuthn (passkey)
- **AI API**: Quatarly (Claude models)

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Quatarly API key

### Installation

1. **Install dependencies**:
```bash
npm install
cd client && npm install
```

2. **Configure environment variables**:
Edit `.env` file with your settings:
```
QUATARLY_API_KEY=your_key_here
DATABASE_URL=postgresql://localhost:5432/nora
PORT=3001
ORIGIN=http://localhost:5173
```

3. **Setup PostgreSQL database**:
```bash
createdb nora
```

4. **Run the application**:
```bash
# Development (runs both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend on port 3001
npm run client  # Frontend on port 5173
```

5. **Access the app**:
Open http://localhost:5173 in your browser

## Usage

1. **Register**: Create account with username + Face ID/Touch ID
2. **Setup Profile**: Add investment context (fund amount, goals, risk tolerance)
3. **Start Learning**: Ask questions about investing, markets, strategies
4. **Switch Models**: Choose between Opus (deep thinking), Sonnet (balanced), or Haiku (fast)

## Deployment to Railway

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/curlyshaan/nora.git
git push -u origin main
```

2. **Deploy on Railway**:
- Connect GitHub repo
- Add PostgreSQL database
- Set environment variables:
  - `QUATARLY_API_KEY`
  - `NODE_ENV=production`
  - `RP_NAME=Nora`
  - `RP_ID=your-app.railway.app`
  - `ORIGIN=https://your-app.railway.app`

3. **Build settings**:
- Build command: `cd client && npm install && npm run build`
- Start command: `npm start`

## Security Notes

- ⚠️ Never commit `.env` file
- 🔒 Quatarly API key stored as Railway environment variable
- 🔐 WebAuthn provides passwordless authentication
- 📱 Face ID/Touch ID required for access

## Project Structure

```
Nora/
├── server/
│   ├── index.js          # Express server
│   ├── db.js             # PostgreSQL setup
│   └── quatarly.js       # Quatarly API integration
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app
│   │   └── App.css       # Styles
│   └── package.json
├── .env                  # Environment variables (not committed)
├── .gitignore
└── package.json
```

## Educational Disclaimer

⚠️ **Nora provides educational content only**. It does not provide personalized financial advice. Always consult licensed financial advisors for investment decisions.

## License

MIT
