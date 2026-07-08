import { join } from 'path';
import { generateStructured } from './gateway';
import { IntentSchema, type ParsedIntent } from './schemas/intent';

export async function parseIntent(userPrompt: string): Promise<ParsedIntent> {
  const promptPath = join(__dirname, 'prompts/parser.md');
  let systemInstruction = 'You are the Intent Parser for Helix. Parse natural language into structured JSON.';
  
  try {
    const file = Bun.file(promptPath);
    systemInstruction = await file.text();
  } catch (error) {
    console.warn('⚠️ Could not load parser prompt file, using default instruction:', error);
  }

  return generateStructured<ParsedIntent>({
    prompt: `Parse the following user request:\n"${userPrompt}"`,
    systemInstruction,
    schema: IntentSchema,
  });
}
