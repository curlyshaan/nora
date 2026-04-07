import axios from 'axios';
import dotenv from 'dotenv';
import { trackUsage } from './usageTracking.js';
import { sendApiErrorAlert } from './usageTracking.js';

dotenv.config();

const QUATARLY_API_KEY = process.env.QUATARLY_API_KEY;
const QUATARLY_BASE_URL = process.env.QUATARLY_BASE_URL;
const TRADIER_API_KEY = process.env.TRADIER_API_KEY;
const TRADIER_BASE_URL = 'https://api.tradier.com/v1';

// Available models
export const MODELS = {
  OPUS: 'claude-opus-4-6-thinking',
  SONNET: 'claude-sonnet-4-6-thinking',
  HAIKU: 'claude-haiku-4-5-20251001'
};

// System prompt for investing learning context
export const INVESTING_SYSTEM_PROMPT = `You are Nora, an AI investing learning assistant with access to real-time market data, web search, chart generation, and memory capabilities.

CAPABILITIES:
- Access to current stock prices, market data, and financial information via Tradier
- Web search for latest news, events, and real-time information
- Educational content about investing, markets, and strategies
- **Chart generation** - You can create visual charts to teach concepts!
- **Memory system** - You can remember user preferences and information across conversations

MEMORY SYSTEM:
When a user asks you to remember something, respond with:
"I'll remember that! [Acknowledge what you're remembering]"

Examples of memory requests:
- "Remember I like Strategy A for Sector X"
- "Remember my favorite stocks are AAPL and TSLA"
- "Remember I prefer value investing over growth"
- "Remember I'm bearish on tech sector"

You have access to the user's saved memories in the system context. Always reference them when relevant.

CHART GENERATION:
You MUST generate interactive charts by using special markdown code blocks. Here are the available chart types:

1. **Stock Price Chart** - Show price movements over time
\`\`\`chart-stock
{
  "title": "AAPL Stock Price",
  "data": [
    {"date": "Jan", "price": 150},
    {"date": "Feb", "price": 155},
    {"date": "Mar", "price": 160}
  ]
}
\`\`\`

2. **Volume Chart** - Show trading volume
\`\`\`chart-volume
{
  "title": "Trading Volume",
  "data": [
    {"date": "Jan", "volume": 1000000},
    {"date": "Feb", "volume": 1200000}
  ]
}
\`\`\`

3. **Technical Indicator Chart** - RSI, MACD, Moving Averages
\`\`\`chart-indicator
{
  "title": "RSI Indicator",
  "data": [
    {"date": "Jan", "rsi": 45},
    {"date": "Feb", "rsi": 65},
    {"date": "Mar", "rsi": 75}
  ],
  "indicators": [
    {"key": "rsi", "name": "RSI", "color": "#667eea"}
  ]
}
\`\`\`

4. **Combined Price + Volume Chart**
\`\`\`chart-price-volume
{
  "title": "Price & Volume Analysis",
  "data": [
    {"date": "Jan", "price": 150, "volume": 1000000},
    {"date": "Feb", "price": 155, "volume": 1200000}
  ]
}
\`\`\`

**CRITICAL CHART RULES:**
- ALWAYS wrap chart JSON in markdown code blocks with the correct language tag (chart-stock, chart-volume, chart-indicator, chart-price-volume)
- NEVER return raw JSON without the code block wrapper
- The three backticks and language tag are REQUIRED for charts to render
- Example: \`\`\`chart-indicator followed by JSON, then closing \`\`\`

**When to use charts:**
- Teaching chart patterns (head & shoulders, triangles, etc.)
- Explaining technical indicators (RSI, MACD, Moving Averages)
- Showing price trends and volume analysis
- Demonstrating support/resistance levels
- Visualizing market concepts

IMPORTANT GUIDELINES:
- You provide educational content about investing concepts, strategies, and market analysis
- You help users understand their options but DO NOT make specific investment recommendations
- Always remind users to consult licensed financial advisors for personalized advice
- Use the user's profile information (fund amount, family size, goals, risk tolerance) to provide relevant educational context
- When users ask about current events, stock prices, or news, use your web search and market data tools
- **Use charts frequently to make concepts visual and easier to understand**
- Be supportive, clear, and patient - assume the user is learning
- Break down complex concepts into understandable pieces
- Use examples and analogies when helpful
- If asked for specific stock picks or "what should I buy", redirect to education about how to evaluate investments

Your goal is to empower users with knowledge through clear explanations AND visual charts, not to replace professional financial advice.`;

// Get stock quote from Tradier (using REST API directly)
export async function getStockQuote(symbol) {
  try {
    await trackUsage('Tradier');

    const response = await axios.get(`${TRADIER_BASE_URL}/markets/quotes`, {
      headers: {
        'Authorization': `Bearer ${TRADIER_API_KEY}`,
        'Accept': 'application/json'
      },
      params: {
        symbols: symbol.toUpperCase()
      }
    });

    // Check for API limit errors
    if (response.status === 429 || response.status === 403) {
      await sendApiErrorAlert('Tradier', `API rate limit or access error (${response.status})`);
      throw new Error(`Tradier API error: ${response.status}`);
    }

    if (response.data && response.data.quotes && response.data.quotes.quote) {
      const quote = response.data.quotes.quote;
      return {
        c: quote.last,           // current price
        h: quote.high,           // high
        l: quote.low,            // low
        o: quote.open,           // open
        pc: quote.prevclose,     // previous close
        t: Date.now() / 1000     // timestamp
      };
    }

    throw new Error('Invalid response from Tradier');
  } catch (error) {
    console.error('Tradier quote error:', error);

    // Check if it's a rate limit error
    if (error.response?.status === 429 || error.response?.status === 403 || error.message?.includes('limit')) {
      await sendApiErrorAlert('Tradier', 'API rate limit exceeded or access denied');
    }

    throw error;
  }
}

// Get company news from Tradier
export async function getCompanyNews(symbol, from, to) {
  try {
    await trackUsage('Tradier');

    // Tradier doesn't have a news endpoint, so we'll use Tavily for news instead
    // This is a placeholder that returns empty array
    console.log('Note: Tradier does not provide news. Use Tavily search for news.');
    return [];

  } catch (error) {
    console.error('Tradier news error:', error);

    if (error.response?.status === 429 || error.message?.includes('limit')) {
      await sendApiErrorAlert('Tradier', 'API rate limit exceeded');
    }

    throw error;
  }
}

// Get earnings calendar from Tradier
export async function getEarningsCalendar(from, to) {
  try {
    await trackUsage('Tradier');

    // Tradier doesn't have an earnings calendar endpoint
    // This is a placeholder that returns empty array
    console.log('Note: Tradier does not provide earnings calendar. Consider using alternative source.');
    return { earningsCalendar: [] };

  } catch (error) {
    console.error('Tradier earnings error:', error);

    if (error.response?.status === 429 || error.message?.includes('limit')) {
      await sendApiErrorAlert('Tradier', 'API rate limit exceeded');
    }

    throw error;
  }
}

// Helper function to remove thinking blocks from response
function removeThinkingBlocks(text) {
  // Remove <thinking>...</thinking> blocks including the tags
  return text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
}

// Streaming response with web search support
export async function streamMessageToQuatarly(messages, model = MODELS.OPUS, userProfile = null, userMemories = [], onChunk) {
  try {
    let systemPrompt = INVESTING_SYSTEM_PROMPT;

    if (userProfile) {
      systemPrompt += `\n\nUSER PROFILE CONTEXT:\n`;
      if (userProfile.fund_amount) systemPrompt += `- Investment Amount: $${userProfile.fund_amount}\n`;
      if (userProfile.family_size) systemPrompt += `- Family Size: ${userProfile.family_size}\n`;
      if (userProfile.investment_timeline) systemPrompt += `- Timeline: ${userProfile.investment_timeline}\n`;
      if (userProfile.risk_tolerance) systemPrompt += `- Risk Tolerance: ${userProfile.risk_tolerance}\n`;
      if (userProfile.financial_goals) systemPrompt += `- Goals: ${userProfile.financial_goals}\n`;
      if (userProfile.additional_context) systemPrompt += `- Additional Context: ${userProfile.additional_context}\n`;
    }

    if (userMemories && userMemories.length > 0) {
      systemPrompt += `\n\nUSER MEMORIES (Important preferences and information the user has asked you to remember):\n`;
      userMemories.forEach(memory => {
        systemPrompt += `- ${memory.memory_key}: ${memory.memory_value}\n`;
      });
      systemPrompt += `\nAlways reference these memories when relevant to the conversation.\n`;
    }

    const response = await axios.post(
      `${QUATARLY_BASE_URL}v1/messages`,
      {
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        stream: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': QUATARLY_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        responseType: 'stream',
        timeout: 60000 // 60 second timeout
      }
    );

    let fullText = '';
    let hasReceivedData = false;
    let lastDataTime = Date.now();
    let insideThinkingBlock = false;
    let buffer = '';

    response.data.on('data', (chunk) => {
      hasReceivedData = true;
      lastDataTime = Date.now();
      const lines = chunk.toString().split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              buffer += parsed.delta.text;

              // Check for thinking block markers
              if (buffer.includes('<thinking>')) {
                insideThinkingBlock = true;
              }

              if (insideThinkingBlock) {
                if (buffer.includes('</thinking>')) {
                  // Remove the entire thinking block
                  buffer = buffer.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
                  insideThinkingBlock = false;

                  // Send any remaining content after the thinking block
                  if (buffer) {
                    fullText += buffer;
                    onChunk(buffer);
                    buffer = '';
                  }
                }
                // Don't send anything while inside thinking block
              } else {
                // Not in thinking block, send the content
                fullText += parsed.delta.text;
                onChunk(parsed.delta.text);
                buffer = '';
              }
            } else if (parsed.type === 'content_block_start' && parsed.content_block?.text) {
              buffer += parsed.content_block.text;

              if (buffer.includes('<thinking>')) {
                insideThinkingBlock = true;
              }

              if (!insideThinkingBlock) {
                fullText += parsed.content_block.text;
                onChunk(parsed.content_block.text);
                buffer = '';
              }
            }
          } catch (e) {
            // Skip invalid JSON
            console.log('Parse error:', e.message);
          }
        }
      }
    });

    return new Promise((resolve, reject) => {
      // Initial timeout for first data
      const initialTimeout = setTimeout(() => {
        if (!hasReceivedData) {
          reject(new Error('Streaming timeout - no data received'));
        }
      }, 15000);

      // Inactivity timeout - if no data for 30 seconds, assume stream is stuck
      const inactivityCheck = setInterval(() => {
        if (hasReceivedData && Date.now() - lastDataTime > 30000) {
          clearInterval(inactivityCheck);
          clearTimeout(initialTimeout);
          if (fullText) {
            console.log('Stream inactive but have data, resolving');
            resolve(fullText);
          } else {
            reject(new Error('Stream inactive with no data'));
          }
        }
      }, 5000);

      response.data.on('end', () => {
        clearTimeout(initialTimeout);
        clearInterval(inactivityCheck);
        resolve(fullText);
      });

      response.data.on('error', (err) => {
        clearTimeout(initialTimeout);
        clearInterval(inactivityCheck);
        reject(err);
      });
    });

  } catch (error) {
    console.error('Quatarly Streaming Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to stream from Quatarly API');
  }
}

// Non-streaming version (for title generation, etc.)
export async function sendMessageToQuatarly(messages, model = MODELS.OPUS, userProfile = null, userMemories = []) {
  try {
    let systemPrompt = INVESTING_SYSTEM_PROMPT;

    if (userProfile) {
      systemPrompt += `\n\nUSER PROFILE CONTEXT:\n`;
      if (userProfile.fund_amount) systemPrompt += `- Investment Amount: $${userProfile.fund_amount}\n`;
      if (userProfile.family_size) systemPrompt += `- Family Size: ${userProfile.family_size}\n`;
      if (userProfile.investment_timeline) systemPrompt += `- Timeline: ${userProfile.investment_timeline}\n`;
      if (userProfile.risk_tolerance) systemPrompt += `- Risk Tolerance: ${userProfile.risk_tolerance}\n`;
      if (userProfile.financial_goals) systemPrompt += `- Goals: ${userProfile.financial_goals}\n`;
      if (userProfile.additional_context) systemPrompt += `- Additional Context: ${userProfile.additional_context}\n`;
    }

    if (userMemories && userMemories.length > 0) {
      systemPrompt += `\n\nUSER MEMORIES (Important preferences and information the user has asked you to remember):\n`;
      userMemories.forEach(memory => {
        systemPrompt += `- ${memory.memory_key}: ${memory.memory_value}\n`;
      });
      systemPrompt += `\nAlways reference these memories when relevant to the conversation.\n`;
    }

    const response = await axios.post(
      `${QUATARLY_BASE_URL}v1/messages`,
      {
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': QUATARLY_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000
      }
    );

    return response.data;
  } catch (error) {
    console.error('Quatarly API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to communicate with Quatarly API');
  }
}
