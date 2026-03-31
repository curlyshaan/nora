import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { initDatabase } from './db.js';
import { sendMessageToQuatarly, streamMessageToQuatarly, MODELS, getStockQuote, getCompanyNews, getEarningsCalendar } from './quatarly.js';
import { searchWeb, formatSearchResults } from './search.js';
import { initUsageTracking, getUsageStats } from './usageTracking.js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Initialize database on startup
initDatabase().catch(console.error);
initUsageTracking().catch(console.error);

// ============= AUTH ROUTES =============

app.post('/api/auth/register/options', async (req, res) => {
  try {
    const { username } = req.body;

    const options = await generateRegistrationOptions({
      rpName: process.env.RP_NAME || 'Nora',
      rpID: process.env.RP_ID || 'localhost',
      userID: username,
      userName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    global.currentChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register/verify', async (req, res) => {
  try {
    const { username, credential } = req.body;

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: global.currentChallenge,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:5173',
      expectedRPID: process.env.RP_ID || 'localhost',
    });

    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      const result = await pool.query(
        'INSERT INTO users (username, credential_id, credential_public_key, counter) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, Buffer.from(credentialID).toString('base64'), Buffer.from(credentialPublicKey).toString('base64'), counter]
      );

      res.json({ verified: true, userId: result.rows[0].id });
    } else {
      res.status(400).json({ error: 'Verification failed' });
    }
  } catch (error) {
    console.error('Registration verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/options', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || 'localhost',
      allowCredentials: [{
        id: Buffer.from(user.rows[0].credential_id, 'base64'),
        type: 'public-key',
      }],
      userVerification: 'preferred',
    });

    global.currentChallenge = options.challenge;
    res.json(options);
  } catch (error) {
    console.error('Login options error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login/verify', async (req, res) => {
  try {
    const { username, credential } = req.body;

    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dbUser = user.rows[0];

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: global.currentChallenge,
      expectedOrigin: process.env.ORIGIN || 'http://localhost:5173',
      expectedRPID: process.env.RP_ID || 'localhost',
      authenticator: {
        credentialID: Buffer.from(dbUser.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(dbUser.credential_public_key, 'base64'),
        counter: dbUser.counter,
      },
    });

    if (verification.verified) {
      await pool.query('UPDATE users SET counter = $1 WHERE id = $2', [verification.authenticationInfo.newCounter, dbUser.id]);
      res.json({ verified: true, userId: dbUser.id, username: dbUser.username });
    } else {
      res.status(400).json({ error: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Login verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= PROFILE ROUTES =============

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fund_amount, family_size, investment_timeline, risk_tolerance, financial_goals, emergency_fund, debts_status, additional_context } = req.body;

    const existing = await pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE user_profiles SET fund_amount = $1, family_size = $2, investment_timeline = $3,
         risk_tolerance = $4, financial_goals = $5, emergency_fund = $6, debts_status = $7,
         additional_context = $8, updated_at = CURRENT_TIMESTAMP WHERE user_id = $9`,
        [fund_amount, family_size, investment_timeline, risk_tolerance, financial_goals, emergency_fund, debts_status, additional_context, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO user_profiles (user_id, fund_amount, family_size, investment_timeline, risk_tolerance,
         financial_goals, emergency_fund, debts_status, additional_context) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, fund_amount, family_size, investment_timeline, risk_tolerance, financial_goals, emergency_fund, debts_status, additional_context]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= MEMORY ROUTES =============

app.get('/api/memories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM user_memories WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { memory_key, memory_value, category } = req.body;

    await pool.query(
      `INSERT INTO user_memories (user_id, memory_key, memory_value, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, memory_key)
       DO UPDATE SET memory_value = $3, category = $4, updated_at = CURRENT_TIMESTAMP`,
      [userId, memory_key, memory_value, category]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/memories/:userId/:memoryId', async (req, res) => {
  try {
    const { userId, memoryId } = req.params;
    await pool.query(
      'DELETE FROM user_memories WHERE id = $1 AND user_id = $2',
      [memoryId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= CONVERSATION ROUTES =============

app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { userId, title, model } = req.body;
    const result = await pool.query(
      'INSERT INTO conversations (user_id, title, model) VALUES ($1, $2, $3) RETURNING *',
      [userId, title || 'New Conversation', model || MODELS.OPUS]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations/:conversationId/title', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    await pool.query(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [title, conversationId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations/:conversationId/generate-title', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;

    // Use AI to generate a concise title
    const titlePrompt = `Generate a short, concise title (max 6 words) for a conversation that starts with: "${message}". Only respond with the title, nothing else.`;

    const response = await sendMessageToQuatarly(
      [{ role: 'user', content: titlePrompt }],
      'claude-haiku-4-5-20251001' // Use fast model for title generation
    );

    // Handle different response formats
    let generatedTitle = 'New Conversation';
    if (response.content && Array.isArray(response.content)) {
      const textBlock = response.content.find(b => b.type === 'text');
      if (textBlock && textBlock.text) {
        generatedTitle = textBlock.text.trim().replace(/['"]/g, '');
      }
    } else if (response.content && response.content[0]?.text) {
      generatedTitle = response.content[0].text.trim().replace(/['"]/g, '');
    }

    await pool.query(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [generatedTitle, conversationId]
    );

    res.json({ success: true, title: generatedTitle });
  } catch (error) {
    console.error('Title generation error:', error);
    // Fallback to truncated message
    const fallback = req.body.message?.substring(0, 50) || 'New Conversation';
    await pool.query(
      'UPDATE conversations SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [fallback, req.params.conversationId]
    );
    res.json({ success: true, title: fallback });
  }
});

app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    await pool.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, userId, message, model } = req.body;

    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
    const userProfile = profileResult.rows[0];

    // Get user memories
    const memoriesResult = await pool.query('SELECT * FROM user_memories WHERE user_id = $1', [userId]);
    const userMemories = memoriesResult.rows;

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'user', message]
    );

    const historyResult = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    let messages = historyResult.rows.map(row => ({
      role: row.role,
      content: row.content
    }));

    // Check if user is asking for current information (news, time, events, stock prices, etc.)
    const needsSearch = /\b(current|latest|today|now|recent|what is|what's|time in|news|happening|stock price)\b/i.test(message);

    if (needsSearch) {
      try {
        console.log('Performing web search for:', message);
        const searchResults = await searchWeb(message, { maxResults: 3 });
        const formattedResults = formatSearchResults(searchResults);

        // Add search results as system context to the last user message
        const lastMessage = messages[messages.length - 1];
        lastMessage.content = `${message}\n\n[Web Search Results]:\n${formattedResults}`;
      } catch (searchErr) {
        console.error('Search failed:', searchErr.message);
        // Continue without search results
      }
    }

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', process.env.ORIGIN || 'http://localhost:5173');

    let fullText = '';
    let hasStartedStreaming = false;

    try {
      // Try streaming first
      fullText = await streamMessageToQuatarly(messages, model, userProfile, userMemories, (chunk) => {
        hasStartedStreaming = true;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      // If streaming succeeded but no text, something went wrong
      if (!fullText) {
        throw new Error('Streaming completed but no content received');
      }
    } catch (streamErr) {
      console.log('Streaming error:', streamErr.message);

      // If we already started streaming, we can't fall back cleanly
      if (hasStartedStreaming) {
        console.log('Stream interrupted mid-response, attempting to save partial content');
        if (!fullText) {
          fullText = 'Sorry, the response was interrupted. Please try again.';
          res.write(`data: ${JSON.stringify({ chunk: '\n\n' + fullText })}\n\n`);
        }
      } else {
        // Haven't started streaming yet, fall back to non-streaming
        console.log('Falling back to non-streaming API call');
        try {
          const response = await sendMessageToQuatarly(messages, model, userProfile, userMemories);
          const textBlock = response.content?.find(b => b.type === 'text');
          fullText = textBlock?.text || response.content?.[0]?.text || 'Sorry, I encountered an error.';
          res.write(`data: ${JSON.stringify({ chunk: fullText })}\n\n`);
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr.message);
          fullText = 'Sorry, I encountered an error. Please try again.';
          res.write(`data: ${JSON.stringify({ chunk: fullText })}\n\n`);
        }
      }
    }

    // Final safety check
    if (!fullText) {
      fullText = 'Sorry, I encountered an error generating a response.';
      res.write(`data: ${JSON.stringify({ chunk: fullText })}\n\n`);
    }

    await pool.query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'assistant', fullText]
    );

    await pool.query(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// ============= MARKET DATA ROUTES =============

app.get('/api/market/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const today = new Date();
    const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
    const from = weekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];
    const news = await getCompanyNews(symbol, from, to);
    res.json((news || []).slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/earnings', async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const from = today.toISOString().split('T')[0];
    const to = nextMonth.toISOString().split('T')[0];
    const calendar = await getEarningsCalendar(from, to);
    res.json((calendar?.earningsCalendar || []).slice(0, 20));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/models', (req, res) => {
  res.json(Object.values(MODELS));
});

// Get API usage stats
app.get('/api/usage-stats', async (req, res) => {
  try {
    const stats = await getUsageStats();
    const tavilyLimit = parseInt(process.env.TAVILY_MONTHLY_LIMIT) || 1000;
    const tavilyThreshold = parseInt(process.env.TAVILY_ALERT_THRESHOLD) || 900;
    const tradierLimit = parseInt(process.env.TRADIER_MONTHLY_LIMIT) || 120000;
    const tradierThreshold = parseInt(process.env.TRADIER_ALERT_THRESHOLD) || 100000;

    res.json({
      tavily: {
        used: stats.Tavily || 0,
        limit: tavilyLimit,
        remaining: tavilyLimit - (stats.Tavily || 0),
        alertThreshold: tavilyThreshold,
        percentage: Math.round(((stats.Tavily || 0) / tavilyLimit) * 100)
      },
      tradier: {
        used: stats.Tradier || 0,
        limit: tradierLimit,
        remaining: tradierLimit - (stats.Tradier || 0),
        alertThreshold: tradierThreshold,
        percentage: Math.round(((stats.Tradier || 0) / tradierLimit) * 100)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Nora server running on port ${PORT}`);
  console.log(`📍 Environment: ${isProduction ? 'production' : 'development'}`);
});
