import { z } from 'zod';

// Configuration schema
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

// Load configuration from environment
export function loadConfig(): LoreConfig {
  return LoreConfigSchema.parse({
    database: {
      type: process.env['DATABASE_TYPE'] || 'sqlite',
      connectionString: process.env['DATABASE_URL'] || 'lore.db',
    },
    llm: {
      provider: process.env['LLM_PROVIDER'] || 'anthropic',
      model: process.env['LLM_MODEL'] || 'claude-3-5-sonnet-20241022',
      apiKey: process.env['ANTHROPIC_API_KEY'] || '',
    },
    storage: {
      zettelkastenPath: process.env['ZETTELKASTEN_PATH'] || './zettelkasten',
      auditLogPath: process.env['AUDIT_LOG_PATH'] || './audit_logs',
    },
    rateLimits: {
      youtube: parseInt(process.env['YOUTUBE_RATE_LIMIT'] || '10'),
      web: parseInt(process.env['WEB_RATE_LIMIT'] || '30'),
      academic: parseInt(process.env['ACADEMIC_RATE_LIMIT'] || '5'),
    },
    defaults: {
      costLimit: parseFloat(process.env['DEFAULT_COST_LIMIT'] || '15'),
      depthLimit: parseInt(process.env['DEFAULT_DEPTH_LIMIT'] || '2'),
      maxTokens: parseInt(process.env['DEFAULT_MAX_TOKENS'] || '4000'),
    },
  });
}