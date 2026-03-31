import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChartRenderer } from './ChartRenderer';
import { detectMemoryRequest, saveMemory } from '../utils/memoryDetection';
import './Chat.css';
import './ChatTheme.css';

const API_URL = 'http://localhost:3001/api';

const MODELS = {
  'claude-opus-4-6-thinking': '🧠 Opus 4.6 Thinking (Best — Deep reasoning)',
  'claude-sonnet-4-6-thinking': '⚡ Sonnet 4.6 Thinking (Balanced)',
  'claude-haiku-4-5-20251001': '🚀 Haiku 4.5 (Fast)',
  'gemini-3.1-pro': '✨ Gemini 3.1 Pro (Google)',
  'gemini-3-flash': '⚡ Gemini 3 Flash (Google Fast)',
  'gpt-5.1': '🤖 GPT-5.1 (OpenAI)',
  'gpt-5.2': '🤖 GPT-5.2 (OpenAI)',
};

function Chat({ user, onLogout, darkMode, toggleTheme }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-opus-4-6-thinking');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [abortController, setAbortController] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [memories, setMemories] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const res = await axios.get(`${API_URL}/memories/${user.userId}`);
      setMemories(res.data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K - New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        createNewConversation();
      }
      // Cmd+/ or Ctrl+/ - Toggle search
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Cmd+Shift+L or Ctrl+Shift+L - Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Escape - Close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${user.userId}`);
      setConversations(res.data);
      if (res.data.length > 0 && !currentConversation) {
        setCurrentConversation(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await axios.post(`${API_URL}/conversations`, {
        userId: user.userId,
        title: 'New Conversation',
        model: selectedModel
      });
      setConversations([res.data, ...conversations]);
      setCurrentConversation(res.data);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation || loading) return;

    const userMessage = input.trim();
    const isFirstMessage = messages.length === 0;
    setInput('');
    setLoading(true);

    // Check if user is asking to remember something
    const memoryDetection = detectMemoryRequest(userMessage);
    if (memoryDetection.shouldSave) {
      // Save memory in background
      saveMemory(user.userId, memoryDetection).then(success => {
        if (success) {
          console.log('✅ Memory saved:', memoryDetection);
        }
      });
    }

    // Add user message to UI immediately
    const tempUserMsg = { role: 'user', content: userMessage, created_at: new Date() };
    setMessages([...messages, tempUserMsg]);

    // Add empty assistant message for streaming
    const tempAssistantMsg = { role: 'assistant', content: '', created_at: new Date(), streaming: true };
    setMessages(prev => [...prev, tempAssistantMsg]);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Use EventSource for SSE streaming
      const eventSource = new EventSource(
        `${API_URL}/chat?conversationId=${currentConversation.id}&userId=${user.userId}&message=${encodeURIComponent(userMessage)}&model=${selectedModel}`,
        { withCredentials: false }
      );

      // Client-side timeout - if no response in 60 seconds, abort
      let responseTimeout = setTimeout(() => {
        console.log('Client timeout - no response received');
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.streaming) {
            lastMsg.content = lastMsg.content || 'Request timed out. Please try again.';
            delete lastMsg.streaming;
          }
          return newMessages;
        });
        setLoading(false);
      }, 60000);

      // Fallback to fetch with streaming
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          userId: user.userId,
          message: userMessage,
          model: selectedModel
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let lastChunkTime = Date.now();

      // Reset timeout when we get first chunk
      const resetTimeout = () => {
        clearTimeout(responseTimeout);
        responseTimeout = setTimeout(() => {
          console.log('Inactivity timeout - no data for 30 seconds');
          if (accumulatedText) {
            // We have some content, just finish with what we have
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.streaming) {
                delete lastMsg.streaming;
              }
              return newMessages;
            });
          }
          setLoading(false);
        }, 30000);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          clearTimeout(responseTimeout);
          break;
        }

        resetTimeout();
        lastChunkTime = Date.now();

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.chunk) {
                accumulatedText += data.chunk;
                // Update the streaming message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.streaming) {
                    lastMsg.content = accumulatedText;
                  }
                  return newMessages;
                });
              }

              if (data.done) {
                clearTimeout(responseTimeout);
                // Mark streaming as complete
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg.streaming) {
                    delete lastMsg.streaming;
                  }
                  return newMessages;
                });
              }

              if (data.error) {
                clearTimeout(responseTimeout);
                throw new Error(data.error);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Auto-generate title from first message using AI
      if (isFirstMessage) {
        try {
          await axios.post(`${API_URL}/conversations/${currentConversation.id}/generate-title`, {
            message: userMessage
          });
        } catch (e) {
          const fallback = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
          await axios.post(`${API_URL}/conversations/${currentConversation.id}/title`, { title: fallback });
        }
      }

      await loadConversations(); // Update conversation list
    } catch (err) {
      console.error('Failed to send message:', err);

      // Update the assistant message with error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.content = '❌ Failed to get response. Please try again.';
          delete lastMsg.streaming;
        }
        return newMessages;
      });

      // Show user-friendly error
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('timeout')) {
        alert('Request timed out. The server might be busy. Please try again.');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startEditingTitle = (conv) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveTitle = async (convId) => {
    try {
      await axios.post(`${API_URL}/conversations/${convId}/title`, {
        title: editingTitle
      });
      setEditingConvId(null);
      await loadConversations();
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const cancelEditing = () => {
    setEditingConvId(null);
    setEditingTitle('');
  };

  const deleteConversation = async (convId) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      await axios.delete(`${API_URL}/conversations/${convId}`);

      // If deleting current conversation, clear it
      if (currentConversation?.id === convId) {
        setCurrentConversation(null);
        setMessages([]);
      }

      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      alert('Failed to delete conversation');
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      // Show temporary success indicator
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const regenerateResponse = async () => {
    if (!currentConversation || messages.length < 2) return;

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove last assistant response
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);

    // Resend the last user message
    setInput(lastUserMessage.content);
    setTimeout(() => sendMessage(), 100);
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);

      // Mark the last message as stopped
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.streaming) {
          lastMsg.content += '\n\n[Generation stopped by user]';
          delete lastMsg.streaming;
        }
        return newMessages;
      });
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteMemoryItem = async (memoryId) => {
    if (!confirm('Delete this memory?')) return;
    try {
      await axios.delete(`${API_URL}/memories/${user.userId}/${memoryId}`);
      await loadMemories();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Nora</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toggle-btn">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <button onClick={createNewConversation} className="new-chat-btn">
          + New Conversation
        </button>

        {showSearch && (
          <div className="search-box">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="conversations-list">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
            >
              {editingConvId === conv.id ? (
                <div className="conv-edit">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveTitle(conv.id)}
                    autoFocus
                  />
                  <button onClick={() => saveTitle(conv.id)}>✓</button>
                  <button onClick={cancelEditing}>✕</button>
                </div>
              ) : (
                <>
                  <div onClick={() => setCurrentConversation(conv)} className="conv-info">
                    <div className="conv-title">{conv.title}</div>
                    <div className="conv-date">{new Date(conv.updated_at).toLocaleDateString()}</div>
                  </div>
                  <div className="conv-actions">
                    <button className="edit-btn" onClick={() => startEditingTitle(conv)}>✏️</button>
                    <button className="delete-btn" onClick={() => deleteConversation(conv.id)}>🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={() => setShowMemories(!showMemories)} className="memory-btn">
            🧠 Memories ({memories.length})
          </button>
          <button onClick={toggleTheme} className="theme-btn">
            {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'}
          </button>
          <button onClick={() => navigate('/profile')} className="profile-btn">
            👤 Profile
          </button>
          <button onClick={onLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>

        {/* Memory Panel */}
        {showMemories && (
          <div className="memory-panel">
            <div className="memory-header">
              <h3>💭 My Memories</h3>
              <button onClick={() => setShowMemories(false)}>✕</button>
            </div>
            <div className="memory-list">
              {memories.length === 0 ? (
                <p className="no-memories">No memories yet. Try saying "Remember that I like..."</p>
              ) : (
                memories.map(mem => (
                  <div key={mem.id} className="memory-item">
                    <div className="memory-content">
                      <strong>{mem.memory_key}:</strong> {mem.memory_value}
                      {mem.category && <span className="memory-category">{mem.category}</span>}
                    </div>
                    <button onClick={() => deleteMemoryItem(mem.id)} className="memory-delete">🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="model-selector">
            <label>Model:</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {Object.entries(MODELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="user-info">Welcome, {user.username}</div>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>👋 Welcome to Nora</h2>
              <p>Your AI-powered investing learning assistant</p>
              <p>Ask me anything about investing, markets, strategies, or financial concepts!</p>
              <div className="disclaimer">
                ⚠️ Educational purposes only. Always consult licensed financial advisors for personalized advice.
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.role === 'assistant' ? (
                    <>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-([\w-]+)/.exec(className || '');
                            const language = match ? match[1] : '';

                            // Check if it's a chart code block
                            if (language.startsWith('chart-')) {
                              return <ChartRenderer code={String(children).trim()} language={language} />;
                            }

                            // Regular code block
                            return !inline ? (
                              <pre className={className}>
                                <code {...props}>{children}</code>
                              </pre>
                            ) : (
                              <code className={className} {...props}>{children}</code>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      <div className="message-actions">
                        <button onClick={() => copyMessage(msg.content)} className="action-btn" title="Copy">
                          📋
                        </button>
                        {idx === messages.length - 1 && !msg.streaming && (
                          <button onClick={regenerateResponse} className="action-btn" title="Regenerate">
                            🔄
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message assistant">
              <div className="message-content typing">
                Thinking...
                <button onClick={stopGeneration} className="stop-btn" title="Stop generation">
                  ⏹️ Stop
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about investing, markets, strategies..."
              disabled={loading || !currentConversation}
              rows={1}
              style={{ height: 'auto', minHeight: '24px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim() || !currentConversation}>
              {loading ? '⏳' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
