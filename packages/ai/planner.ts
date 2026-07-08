import { join } from 'path';
import { generateStructured } from './gateway';
import { ExecutionPlanSchema, type ExecutionPlan } from './schemas/execution';
import { type ParsedIntent } from './schemas/intent';

export async function planExecution(intent: ParsedIntent): Promise<ExecutionPlan> {
  const promptPath = join(__dirname, 'prompts/planner.md');
  let systemInstruction = 'You are the Task Planner for Helix. Generate a task DAG from a structured Intent.';

  try {
    const file = Bun.file(promptPath);
    systemInstruction = await file.text();
  } catch (error) {
    console.warn('⚠️ Could not load planner prompt file, using default instruction:', error);
  }

  const promptText = `Generate an execution plan DAG for the following intent:\n${JSON.stringify(intent, null, 2)}`;

  return generateStructured<ExecutionPlan>({
    prompt: promptText,
    systemInstruction,
    schema: ExecutionPlanSchema,
  });
}
