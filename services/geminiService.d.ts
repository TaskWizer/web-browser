import type { ConversationMessage } from "../types";
/**
 * Check if Gemini API is available
 */
export declare const isGeminiAvailable: () => boolean;
/**
 * Search using Gemini API or fallback to Google search (non-streaming)
 */
export declare const searchWithGemini: (query: string) => Promise<string>;
/**
 * Stream AI response using Gemini API with real-time text chunks
 * @param query - The user's search query
 * @param onChunk - Callback function called for each text chunk received
 * @param onComplete - Callback function called when streaming is complete
 * @param onError - Callback function called if an error occurs
 * @param conversationHistory - Optional conversation history for context
 */
export declare const streamGeminiResponse: (query: string, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: string) => void, conversationHistory?: ConversationMessage[]) => Promise<void>;
/**
 * Generate contextually relevant suggested prompts based on the query and answer
 * @param query - The user's original query
 * @param answer - The AI's response
 * @returns Array of suggested follow-up prompts
 */
export declare const generateSuggestedPrompts: (query: string, answer: string) => string[];
//# sourceMappingURL=geminiService.d.ts.map