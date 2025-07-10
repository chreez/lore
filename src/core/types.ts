import { z } from 'zod';

// Core Lore types following the 12-Factor Agents methodology

// Error handling (Factor 9: Compact Errors)
export const LoreErrorSchema = z.object({
  type: z.enum(['scraper_failure', 'parse_error', 'rate_limit', 'network', 'database', 'validation']),
  message: z.string(),
  context: z.string(),
  suggestion: z.string(),
  agent: z.string(),
  canRetry: z.boolean(),
  timestamp: z.date().default(() => new Date()),
});

export type LoreError = z.infer<typeof LoreErrorSchema>;

// Agent state (Factor 5: Separate execution/business state)
export const AgentStateSchema = z.object({
  id: z.string(),
  type: z.enum(['orchestrator', 'scraper', 'processor', 'generator']),
  status: z.enum(['idle', 'running', 'completed', 'failed', 'paused']),
  progress: z.number().min(0).max(1),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  errors: z.array(LoreErrorSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// Research session
export const ResearchSessionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  depthLimit: z.number().min(1).max(5).default(2),
  status: z.enum(['running', 'completed', 'failed', 'paused']),
  agents: z.array(AgentStateSchema).default([]),
  costEstimate: z.number().default(0),
  costLimit: z.number().default(15),
});

export type ResearchSession = z.infer<typeof ResearchSessionSchema>;

// Source tracking
export const SourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string().optional(),
  author: z.string().optional(),
  contentDate: z.date().optional(),
  scrapedAt: z.date(),
  scraperTool: z.string(),
  extractionMethod: z.string(),
  rawContent: z.string(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export type Source = z.infer<typeof SourceSchema>;

// Note types
export const NoteSchema = z.object({
  id: z.string(), // YYYYMMDD-HHMMSS-topic-subtopic
  content: z.string(),
  createdAt: z.date(),
  sourceId: z.string(),
  confidence: z.number().min(0).max(1),
  noteType: z.enum(['atomic', 'synthesis', 'question']),
  tags: z.array(z.string()).default([]),
  contentTypes: z.array(z.enum(['FACT', 'OPINION', 'DATA', 'CLAIM', 'QUESTION'])).default([]),
});

export type Note = z.infer<typeof NoteSchema>;

// Note relationships
export const NoteLinkSchema = z.object({
  fromNoteId: z.string(),
  toNoteId: z.string(),
  linkType: z.enum(['supports', 'contradicts', 'extends', 'questions']),
  strength: z.number().min(0).max(1).default(0.5),
});

export type NoteLink = z.infer<typeof NoteLinkSchema>;

// Agent context (Factor 3: Context management)
export const AgentContextSchema = z.object({
  sessionId: z.string(),
  agentId: z.string(),
  maxTokens: z.number().default(4000),
  currentTokens: z.number().default(0),
  metadata: z.record(z.unknown()).default({}),
  parentContext: z.string().optional(),
});

export type AgentContext = z.infer<typeof AgentContextSchema>;

// Agent result
export const AgentResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: LoreErrorSchema.optional(),
  tokensUsed: z.number().default(0),
  cost: z.number().default(0),
  duration: z.number().default(0),
  metadata: z.record(z.unknown()).default({}),
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

// Tool definition (Factor 4: Tool registry)
export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
  requiredPermissions: z.array(z.string()).default([]),
  rateLimits: z.object({
    requestsPerMinute: z.number().default(30),
    tokensPerMinute: z.number().default(10000),
  }).default({}),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

// Human approval (Factor 7: Human integration)
export const ApprovalRequestSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  agentId: z.string(),
  type: z.enum(['rate_limit', 'paywall', 'low_confidence', 'contradiction']),
  message: z.string(),
  context: z.record(z.unknown()).default({}),
  channels: z.array(z.enum(['slack', 'email', 'web_ui'])).default(['web_ui']),
  timeout: z.number().default(600), // 10 minutes
  createdAt: z.date(),
  approvedAt: z.date().optional(),
  approved: z.boolean().optional(),
  approver: z.string().optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

// Audit log entry
export const AuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  sessionId: z.string(),
  agentId: z.string().optional(),
  action: z.string(),
  tool: z.string().optional(),
  details: z.record(z.unknown()).default({}),
  duration: z.number().optional(),
  cost: z.number().optional(),
  tokensUsed: z.number().optional(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// Configuration
export const LoreConfigSchema = z.object({
  database: z.object({
    type: z.enum(['sqlite', 'postgresql']).default('sqlite'),
    connectionString: z.string().default('lore.db'),
  }),
  llm: z.object({
    provider: z.enum(['anthropic', 'openai']).default('anthropic'),
    model: z.string().default('claude-3-5-sonnet-20241022'),
    apiKey: z.string(),
  }),
  storage: z.object({
    zettelkastenPath: z.string().default('./zettelkasten'),
    auditLogPath: z.string().default('./audit_logs'),
  }),
  rateLimits: z.object({
    youtube: z.number().default(10),
    web: z.number().default(30),
    academic: z.number().default(5),
  }),
  defaults: z.object({
    costLimit: z.number().default(15),
    depthLimit: z.number().default(2),
    maxTokens: z.number().default(4000),
  }),
});

export type LoreConfig = z.infer<typeof LoreConfigSchema>;

// Utility type for creating IDs
export const createId = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

// Utility type for creating note IDs
export const createNoteId = (topic: string, subtopic?: string): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const cleanSubtopic = subtopic?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  
  return cleanSubtopic ? `${timestamp}-${cleanTopic}-${cleanSubtopic}` : `${timestamp}-${cleanTopic}`;
};