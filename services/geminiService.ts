import { GoogleGenAI } from "@google/genai";
import type { ConversationMessage } from "../types";

// Get API key from environment variables using load balancing
const getApiKey = (): string | undefined => {
  // Check for multi-key environment variable first
  if (typeof import.meta !== 'undefined' && (globalThis as any).importMetaEnv?.GOOGLE_API_KEYS) {
    const keys = (globalThis as any).importMetaEnv.GOOGLE_API_KEYS;
    if (keys && typeof keys === 'string') {
      // Return first key from comma-separated list for basic compatibility
      // In the future, this could integrate with the load balancing system
      return keys.split(',')[0].trim();
    }
  }
  // Fallback to single key for backward compatibility
  if (typeof import.meta !== 'undefined' && (globalThis as any).importMetaEnv?.GEMINI_API_KEY) {
    return (globalThis as any).importMetaEnv.GEMINI_API_KEY;
  }
  // Fallback to process.env for development (injected by Vite config)
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return undefined;
};

const API_KEY = getApiKey();

// Initialize Gemini AI client only if API key is available
let ai: GoogleGenAI | null = null;
let initializationError: string | null = null;

try {
  if (API_KEY && API_KEY.trim() !== '') {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('Gemini API initialized successfully');
  } else {
    initializationError = 'Gemini API key not found. Using fallback search.';
    console.warn(initializationError);
  }
} catch (error) {
  initializationError = `Failed to initialize Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(initializationError);
}

/**
 * Check if Gemini API is available
 */
export const isGeminiAvailable = (): boolean => {
  return ai !== null && initializationError === null;
};

/**
 * Get the current model name from environment or use default
 */
const getModelName = (): string => {
  if (typeof globalThis !== 'undefined' && (globalThis as any).importMetaEnv?.VITE_GEMINI_MODEL) {
    return (globalThis as any).importMetaEnv.VITE_GEMINI_MODEL;
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }
  return 'models/gemma-3-27b-it'; // Default model
};

/**
 * Search using Gemini API or fallback to Google search (non-streaming)
 */
export const searchWithGemini = async (query: string): Promise<string> => {
  // If Gemini is not available, return a message with Google search link
  if (!ai || initializationError) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return `## Gemini API Unavailable\n\n${initializationError || 'Gemini API is not configured.'}\n\n**Fallback to Google Search:**\n\nYour query: **${query}**\n\n[Click here to search on Google](${googleSearchUrl})\n\n---\n\n**To enable Gemini AI search:**\n1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)\n2. Add it to your \`.env.local\` file as \`VITE_GEMINI_API_KEY=your_key_here\`\n3. Restart the development server`;
  }

  try {
    const modelName = getModelName();
    const prompt = `You are a powerful AI search assistant integrated into a web browser. Provide a comprehensive, well-structured, and concise answer to the following user query. Use markdown for formatting. Query: "${query}"`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || 'No response generated';
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Provide helpful error message with fallback
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return `## Search Error\n\nFailed to get results from Gemini API: ${errorMessage}\n\n**Fallback to Google Search:**\n\nYour query: **${query}**\n\n[Click here to search on Google](${googleSearchUrl})\n\n---\n\n**Troubleshooting:**\n- Check your API key is valid\n- Verify you have API quota remaining\n- Check your internet connection`;
  }
};

/**
 * Stream AI response using Gemini API with real-time text chunks
 * @param query - The user's search query
 * @param onChunk - Callback function called for each text chunk received
 * @param onComplete - Callback function called when streaming is complete
 * @param onError - Callback function called if an error occurs
 * @param conversationHistory - Optional conversation history for context
 */
export const streamGeminiResponse = async (
  query: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void,
  conversationHistory?: ConversationMessage[]
): Promise<void> => {
  // If Gemini is not available, return error message
  if (!ai || initializationError) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const errorMessage = `## Gemini API Unavailable\n\n${initializationError || 'Gemini API is not configured.'}\n\n**Fallback to Google Search:**\n\nYour query: **${query}**\n\n[Click here to search on Google](${googleSearchUrl})\n\n---\n\n**To enable Gemini AI search:**\n1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)\n2. Add it to your \`.env.local\` file as \`VITE_GEMINI_API_KEY=your_key_here\`\n3. Restart the development server`;

    onChunk(errorMessage);
    onComplete();
    return;
  }

  try {
    const modelName = getModelName();

    // Build conversation context if history exists
    let prompt = `You are a powerful AI search assistant integrated into a web browser. Provide a comprehensive, well-structured, and concise answer to the following user query. Use markdown for formatting.`;

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `\n\nConversation history:\n`;
      // Include last 10 messages to avoid token limits
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${msg.content}\n`;
      }
      prompt += `\nCurrent query: "${query}"`;
    } else {
      prompt += ` Query: "${query}"`;
    }

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: prompt,
    });

    // Process streaming chunks as they arrive
    for await (const chunk of response) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }

    onComplete();
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Provide helpful error message with fallback
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const errorResponse = `## Search Error\n\nFailed to get results from Gemini API: ${errorMessage}\n\n**Fallback to Google Search:**\n\nYour query: **${query}**\n\n[Click here to search on Google](${googleSearchUrl})\n\n---\n\n**Troubleshooting:**\n- Check your API key is valid\n- Verify you have API quota remaining\n- Check your internet connection`;

    onError(errorResponse);
  }
};

/**
 * Generate contextually relevant suggested prompts based on the query and answer
 * @param query - The user's original query
 * @param answer - The AI's response
 * @returns Array of suggested follow-up prompts
 */
export const generateSuggestedPrompts = (query: string, answer: string): string[] => {
  // Generic suggested prompts that work for most queries
  const genericPrompts = [
    "Can you explain this in simpler terms?",
    "What are some practical examples?",
    "Tell me more about this topic",
    "What are the alternatives?",
    "How does this compare to other approaches?"
  ];

  // Context-aware prompts based on query keywords
  const contextualPrompts: string[] = [];

  const lowerQuery = query.toLowerCase();
  const lowerAnswer = answer.toLowerCase();

  // Code-related queries
  if (lowerQuery.includes('code') || lowerQuery.includes('function') || lowerQuery.includes('program') ||
      lowerAnswer.includes('```') || lowerAnswer.includes('function') || lowerAnswer.includes('class')) {
    contextualPrompts.push("Show me a complete working example");
    contextualPrompts.push("What are common mistakes to avoid?");
    contextualPrompts.push("How can I optimize this code?");
  }

  // How-to queries
  if (lowerQuery.startsWith('how to') || lowerQuery.startsWith('how do')) {
    contextualPrompts.push("What are the prerequisites?");
    contextualPrompts.push("Can you provide a step-by-step guide?");
    contextualPrompts.push("What tools do I need?");
  }

  // Comparison queries
  if (lowerQuery.includes('vs') || lowerQuery.includes('versus') || lowerQuery.includes('compare')) {
    contextualPrompts.push("Which one should I choose?");
    contextualPrompts.push("What are the pros and cons?");
    contextualPrompts.push("Are there other options to consider?");
  }

  // Explanation queries
  if (lowerQuery.includes('what is') || lowerQuery.includes('explain') || lowerQuery.includes('define')) {
    contextualPrompts.push("Can you give me a real-world example?");
    contextualPrompts.push("How is this used in practice?");
    contextualPrompts.push("What are the key concepts?");
  }

  // Problem-solving queries
  if (lowerQuery.includes('error') || lowerQuery.includes('problem') || lowerQuery.includes('issue') ||
      lowerQuery.includes('fix') || lowerQuery.includes('debug')) {
    contextualPrompts.push("What are other possible solutions?");
    contextualPrompts.push("How can I prevent this in the future?");
    contextualPrompts.push("What's the root cause?");
  }

  // Combine contextual and generic prompts, prioritize contextual
  const allPrompts = [...contextualPrompts, ...genericPrompts];

  // Return 4-5 unique prompts
  const uniquePrompts = Array.from(new Set(allPrompts));
  return uniquePrompts.slice(0, 5);
};

// Export a class for better TypeScript compatibility
export class GeminiService {
  static async searchWithGemini(query: string) {
    return searchWithGemini(query);
  }

  static async generateContextualPrompts(query: string, answer: string) {
    return generateSuggestedPrompts(query, answer);
  }
}
