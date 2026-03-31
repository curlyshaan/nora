import { tavily } from '@tavily/core';
import dotenv from 'dotenv';
import { trackUsage } from './usageTracking.js';

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || 'tvly-demo';
const tavilyClient = tavily({ apiKey: TAVILY_API_KEY });

// Search the web using Tavily
export async function searchWeb(query, options = {}) {
  try {
    // Track usage before making the call
    await trackUsage('Tavily');

    const response = await tavilyClient.search(query, {
      searchDepth: options.depth || 'basic',
      maxResults: options.maxResults || 5,
      includeAnswer: true,
      includeRawContent: false
    });

    return {
      answer: response.answer,
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score
      }))
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    throw error;
  }
}

// Format search results for AI context
export function formatSearchResults(searchData) {
  let formatted = '';

  if (searchData.answer) {
    formatted += `Quick Answer: ${searchData.answer}\n\n`;
  }

  formatted += 'Search Results:\n';
  searchData.results.forEach((result, idx) => {
    formatted += `${idx + 1}. ${result.title}\n`;
    formatted += `   ${result.content}\n`;
    formatted += `   Source: ${result.url}\n\n`;
  });

  return formatted;
}
