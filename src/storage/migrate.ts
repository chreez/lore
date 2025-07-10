#!/usr/bin/env tsx

import { LoreDatabase } from './database';
import { LoreConfigSchema } from '../core/types';

// Database migration script
async function migrate(): Promise<void> {
  const config = LoreConfigSchema.parse({
    database: {
      type: 'sqlite',
      connectionString: process.env['DATABASE_URL'] || 'lore.db',
    },
    llm: {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: process.env['ANTHROPIC_API_KEY'] || '',
    },
    storage: {
      zettelkastenPath: './zettelkasten',
      auditLogPath: './audit_logs',
    },
    rateLimits: {
      youtube: 10,
      web: 30,
      academic: 5,
    },
    defaults: {
      costLimit: 15,
      depthLimit: 2,
      maxTokens: 4000,
    },
  });

  console.log('🚀 Starting database migration...');
  
  const db = new LoreDatabase(config);
  
  try {
    await db.initialize();
    console.log('✅ Database migration completed successfully');
    
    // Verify migration
    const isHealthy = db.healthCheck();
    if (isHealthy) {
      console.log('✅ Database health check passed');
    } else {
      console.error('❌ Database health check failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().catch(console.error);
}

export { migrate };