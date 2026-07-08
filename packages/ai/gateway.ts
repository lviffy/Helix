import { ai, GEMINI_MODEL } from './client';
import { type ZodType } from 'zod';

export interface GenerateConfig<T> {
  prompt: string;
  systemInstruction?: string;
  schema?: ZodType<T>;
}

export async function generateStructured<T>({
  prompt,
  systemInstruction,
  schema,
}: GenerateConfig<T>): Promise<T> {
  try {
    // If schema is provided, we can pass it to responseSchema.
    // Note: The @google/genai library supports responseSchema as part of config.
    const config: any = {
      temperature: 0.1,
    };

    if (schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = schema;
    }

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config,
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty response from Gemini model');
    }

    if (schema) {
      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      return validated;
    }

    return text as unknown as T;
  } catch (error) {
    console.error('🔴 Error in Gemini API Generation Gateway:', error);
    throw error;
  }
}
