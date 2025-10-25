import { GoogleGenAI } from "@google/genai";

// Get API key from environment variables (supports both VITE_ prefix and direct access)
const getApiKey = (): string | undefined => {
  // Check for Vite environment variable first (for production builds)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
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
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_MODEL) {
    return import.meta.env.VITE_GEMINI_MODEL;
  }
  if (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) {
    return process.env.GEMINI_MODEL;
  }
  return 'models/gemma-3-27b-it'; // Default model
};

/**
 * Search using Gemini API or fallback to Google search
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

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Provide helpful error message with fallback
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return `## Search Error\n\nFailed to get results from Gemini API: ${errorMessage}\n\n**Fallback to Google Search:**\n\nYour query: **${query}**\n\n[Click here to search on Google](${googleSearchUrl})\n\n---\n\n**Troubleshooting:**\n- Check your API key is valid\n- Verify you have API quota remaining\n- Check your internet connection`;
  }
};
