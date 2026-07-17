import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || 'mock-api-key-for-now';

export const ai = new GoogleGenAI({ apiKey });

// Default to gemini-2.5-flash for fast, cost-efficient structured outputs
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
