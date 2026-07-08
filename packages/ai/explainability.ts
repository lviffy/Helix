import { join } from 'path';
import { generateStructured } from './gateway';
import { ExecutionExplainabilitySchema, type ExecutionExplainability } from './schemas/response';

export async function explainExecution(
  intent: any,
  executionTrail: any
): Promise<ExecutionExplainability> {
  const promptPath = join(__dirname, 'prompts/explainability.md');
  let systemInstruction = 'You are the Explainability Engine for Helix. Summarize execution logs in plain English.';

  try {
    const file = Bun.file(promptPath);
    systemInstruction = await file.text();
  } catch (error) {
    console.warn('⚠️ Could not load explainability prompt file, using default instruction:', error);
  }

  const promptText = `
Given the user intent:
${JSON.stringify(intent, null, 2)}

And the transaction/auction logs trail:
${JSON.stringify(executionTrail, null, 2)}

Provide the structured explanation summary and step description.
`;

  return generateStructured<ExecutionExplainability>({
    prompt: promptText,
    systemInstruction,
    schema: ExecutionExplainabilitySchema,
  });
}
