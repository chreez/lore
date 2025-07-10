import { AgentContext } from '../types';
import { createId } from '../utils/id';
import { LoreAgent } from './base';
import { AgentRegistry } from './registry';

// Agent Factory for creating agents with proper context
export class AgentFactory {
  static createContext(sessionId: string, maxTokens: number = 4000): AgentContext {
    return {
      sessionId,
      agentId: createId(),
      maxTokens,
      currentTokens: 0,
      metadata: {},
    };
  }

  static createAgent(
    name: string, 
    sessionId: string, 
    options: { maxTokens?: number; metadata?: Record<string, unknown> } = {}
  ): LoreAgent {
    const context = this.createContext(sessionId, options.maxTokens);
    if (options.metadata) {
      context.metadata = options.metadata;
    }
    return AgentRegistry.create(name, context);
  }
}