#!/usr/bin/env node

import { LoreConfigSchema } from './core/types';
import { SessionManager } from './core/executor';
import { LoreDatabase } from './storage/database';

// Main entry point for Lore
export async function main(): Promise<void> {
  try {
    // Load configuration
    const config = LoreConfigSchema.parse({
      database: {
        type: 'sqlite',
        connectionString: process.env['DATABASE_URL'] || 'lore.db',
      },
      llm: {
        provider: 'anthropic',
        model: process.env['LLM_MODEL'] || 'claude-3-5-sonnet-20241022',
        apiKey: process.env['ANTHROPIC_API_KEY'] || '',
      },
      storage: {
        zettelkastenPath: process.env['ZETTELKASTEN_PATH'] || './zettelkasten',
        auditLogPath: process.env['AUDIT_LOG_PATH'] || './audit_logs',
      },
      rateLimits: {
        youtube: parseInt(process.env['YOUTUBE_RATE_LIMIT'] || '10', 10),
        web: parseInt(process.env['WEB_RATE_LIMIT'] || '30', 10),
        academic: parseInt(process.env['ACADEMIC_RATE_LIMIT'] || '5', 10),
      },
      defaults: {
        costLimit: parseFloat(process.env['DEFAULT_COST_LIMIT'] || '15'),
        depthLimit: parseInt(process.env['DEFAULT_DEPTH_LIMIT'] || '2', 10),
        maxTokens: parseInt(process.env['DEFAULT_MAX_TOKENS'] || '4000', 10),
      },
    });

    // Initialize database
    console.log('🚀 Initializing Lore database...');
    const database = new LoreDatabase(config);
    await database.initialize();
    console.log('✅ Database initialized successfully');

    // Initialize session manager
    console.log('🚀 Starting Lore session manager...');
    const sessionManager = new SessionManager(config);

    // Example usage - this would typically be driven by CLI or API
    if (process.argv.length > 2) {
      const topic = process.argv.slice(2).join(' ');
      console.log(`🔍 Starting research on: "${topic}"`);
      
      const { sessionId } = await sessionManager.createSession(topic);
      console.log(`📝 Created session: ${sessionId}`);
      
      const results = await sessionManager.executeSession(sessionId);
      console.log('📊 Research completed:', results);
    } else {
      console.log('💡 Lore is ready! Usage: npm start "your research topic"');
    }

    // Cleanup
    database.close();
    sessionManager.cleanup();
    
  } catch (error) {
    console.error('❌ Lore failed to start:', error);
    process.exit(1);
  }
}

// Export core components for library usage
export * from './core/types';
export * from './core/agent';
export * from './core/executor';
export * from './core/errors';
export * from './storage/database';

// Run main function if called directly
if (require.main === module) {
  main().catch(console.error);
}