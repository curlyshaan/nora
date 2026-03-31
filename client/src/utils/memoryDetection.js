import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Detect if user is asking to remember something
 * Returns { shouldSave: boolean, key: string, value: string, category: string }
 */
export function detectMemoryRequest(message) {
  const lowerMessage = message.toLowerCase();

  // Memory trigger patterns
  const memoryPatterns = [
    /remember (?:that )?(.+)/i,
    /save (?:that )?(.+)/i,
    /keep in mind (?:that )?(.+)/i,
    /don't forget (?:that )?(.+)/i,
    /note (?:that )?(.+)/i
  ];

  for (const pattern of memoryPatterns) {
    const match = message.match(pattern);
    if (match) {
      const content = match[1].trim();

      // Try to extract key-value from common patterns
      // "I like X for Y" -> key: Y, value: X
      // "my favorite X is Y" -> key: favorite X, value: Y
      // "I prefer X over Y" -> key: preference, value: X over Y

      let key = 'general';
      let value = content;
      let category = 'preference';

      // Pattern: "I like/prefer X for Y"
      const likeForMatch = content.match(/i (?:like|prefer) (.+?) for (.+)/i);
      if (likeForMatch) {
        key = likeForMatch[2].trim();
        value = likeForMatch[1].trim();
        category = 'strategy';
      }

      // Pattern: "my favorite X is/are Y"
      const favoriteMatch = content.match(/my favorite (.+?) (?:is|are) (.+)/i);
      if (favoriteMatch) {
        key = `favorite ${favoriteMatch[1].trim()}`;
        value = favoriteMatch[2].trim();
        category = 'favorites';
      }

      // Pattern: "I'm bullish/bearish on X"
      const sentimentMatch = content.match(/i'?m (bullish|bearish) on (.+)/i);
      if (sentimentMatch) {
        key = `sentiment on ${sentimentMatch[2].trim()}`;
        value = sentimentMatch[1].trim();
        category = 'market_view';
      }

      return {
        shouldSave: true,
        key,
        value,
        category,
        originalMessage: content
      };
    }
  }

  return { shouldSave: false };
}

/**
 * Save memory to backend
 */
export async function saveMemory(userId, memoryData) {
  try {
    await axios.post(`${API_URL}/memories/${userId}`, {
      memory_key: memoryData.key,
      memory_value: memoryData.value,
      category: memoryData.category
    });
    return true;
  } catch (error) {
    console.error('Failed to save memory:', error);
    return false;
  }
}

/**
 * Get all memories for a user
 */
export async function getMemories(userId) {
  try {
    const response = await axios.get(`${API_URL}/memories/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get memories:', error);
    return [];
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(userId, memoryId) {
  try {
    await axios.delete(`${API_URL}/memories/${userId}/${memoryId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete memory:', error);
    return false;
  }
}
