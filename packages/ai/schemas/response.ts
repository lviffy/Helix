import { z } from 'zod';

export const BidRatingSchema = z.object({
  agentId: z.string(),
  safetyScore: z.number().min(0).max(100),
  costScore: z.number().min(0).max(100),
  speedScore: z.number().min(0).max(100),
  reason: z.string().describe('Short explanation of score assignment for this specific agent'),
});

export const DecisionExplanationSchema = z.object({
  selectedAgentId: z.string().describe('The ID of the winning agent'),
  reasoning: z.string().describe('Detailed logic describing why this agent was selected over alternatives'),
  ratings: z.array(BidRatingSchema).describe('Scores assigned to all bidders for transparency'),
  recommendationNote: z.string().optional().describe('Any custom note for the user regarding this decision'),
});

export const ExecutionExplainabilitySchema = z.object({
  title: z.string().describe('Friendly title of the transaction steps'),
  summary: z.string().describe('Plain-English explanation of what actions were taken and why'),
  stepsDescription: z.array(z.string()).describe('Sequential breakdown of the verified execution steps'),
});

export type DecisionExplanation = z.infer<typeof DecisionExplanationSchema>;
export type ExecutionExplainability = z.infer<typeof ExecutionExplainabilitySchema>;
