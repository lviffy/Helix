import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

export * from './schema';

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Agent = InferSelectModel<typeof schema.agents>;
export type NewAgent = InferInsertModel<typeof schema.agents>;

export type Intent = InferSelectModel<typeof schema.intents>;
export type NewIntent = InferInsertModel<typeof schema.intents>;

export type Task = InferSelectModel<typeof schema.tasks>;
export type NewTask = InferInsertModel<typeof schema.tasks>;

export type Bid = InferSelectModel<typeof schema.bids>;
export type NewBid = InferInsertModel<typeof schema.bids>;

export type AuditLog = InferSelectModel<typeof schema.auditLogs>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLogs>;
export type AuditLogDetails = Record<string, any>;
