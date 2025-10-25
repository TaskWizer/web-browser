

import { GoogleGenAI } from "@google/genai";

// FIX: Initialize with process.env.API_KEY directly and remove unnecessary checks, per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchWithGemini = async (query: string): Promise<string> => {
  try {
    const prompt = `You are a powerful AI search assistant integrated into a web browser. Provide a comprehensive, well-structured, and concise answer to the following user query. Use markdown for formatting. Query: "${query}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I couldn't process that search. Please try again.";
  }
};
