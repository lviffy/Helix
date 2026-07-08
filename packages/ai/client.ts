import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || 'mock-api-key-for-now';

export const ai = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // Fallback to current available stable flash if needed, but defaults to gemini-3.1-flash-lite
