import { 
  AgentState, 
  AgentContext, 
  AgentResult, 
  LoreError,
  createId 
} from './types';
import { LoreErrorHandler } from './errors';

// Base Agent class following 12-Factor Agents methodology
export abstract class LoreAgent {
  protected state: AgentState;
  protected context: AgentContext;

  constructor(
    type: AgentState['type'],
    context: AgentContext
  ) {
    this.state = {
      id: createId(),
      type,
      status: 'idle',
      progress: 0,
      errors: [],
      metadata: {},
    };
    this.context = context;
  }

  // Factor 1: One Tool, One Function - Each agent has a single, clear purpose
  abstract get purpose(): string;
  
  // Factor 2: Code Ownership - Agents generate complete, editable implementations
  abstract execute(): Promise<AgentResult>;

  // Factor 5: Separate execution/business state
  getState(): AgentState {
    return { ...this.state };
  }

  getContext(): AgentContext {
    return { ...this.context };
  }

  // Factor 8: Explicit control flow
  async run(): Promise<AgentResult> {
    try {
      this.updateState({ status: 'running', startedAt: new Date() });
      
      const result = await this.execute();
      
      if (result.success) {
        this.updateState({ 
          status: 'completed', 
          completedAt: new Date(),
          progress: 1 
        });
      } else {
        this.updateState({ 
          status: 'failed', 
          completedAt: new Date() 
        });
        if (result.error) {
          this.addError(result.error);
        }
      }
      
      return result;
    } catch (error) {
      const loreError = LoreErrorHandler.fromError(error as Error, this.context);
      this.addError(loreError);
      this.updateState({ status: 'failed', completedAt: new Date() });
      
      return {
        success: false,
        error: loreError,
        tokensUsed: 0,
        cost: 0,
        duration: 0,
        metadata: {},
      };
    }
  }

  // Factor 12: Stateless - Pure functions, resumable
  pause(): void {
    this.updateState({ status: 'paused' });
  }

  resume(): void {
    this.updateState({ status: 'running' });
  }

  // Factor 9: Compact errors
  protected addError(error: LoreError): void {
    this.state.errors.push(error);
  }

  protected updateState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
  }

  protected updateProgress(progress: number): void {
    this.updateState({ progress: Math.max(0, Math.min(1, progress)) });
  }

  // Factor 6: Observable - Log all state transitions
  protected log(action: string, details?: Record<string, unknown>): void {
    // This would typically go to the audit log
    console.log(`[${this.state.id}] ${action}`, details);
  }

  // Helper method for creating successful results
  protected success(data?: unknown, metadata?: Record<string, unknown>): AgentResult {
    return {
      success: true,
      data,
      tokensUsed: 0,
      cost: 0,
      duration: 0,
      metadata: metadata || {},
    };
  }

  // Helper method for creating error results
  protected failure(error: LoreError, metadata?: Record<string, unknown>): AgentResult {
    return {
      success: false,
      error,
      tokensUsed: 0,
      cost: 0,
      duration: 0,
      metadata: metadata || {},
    };
  }
}

// Agent Registry (Factor 4: Tool registry)
export class AgentRegistry {
  private static agents: Map<string, new (context: AgentContext) => LoreAgent> = new Map();

  static register(name: string, agentClass: new (context: AgentContext) => LoreAgent): void {
    this.agents.set(name, agentClass);
  }

  static create(name: string, context: AgentContext): LoreAgent {
    const AgentClass = this.agents.get(name);
    if (!AgentClass) {
      throw new Error(`Agent '${name}' not found in registry`);
    }
    return new AgentClass(context);
  }

  static list(): string[] {
    return Array.from(this.agents.keys());
  }

  static has(name: string): boolean {
    return this.agents.has(name);
  }
}

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

// Agent Pool for managing multiple agents
export class AgentPool {
  private agents: Map<string, LoreAgent> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  add(agent: LoreAgent): void {
    this.agents.set(agent.getState().id, agent);
  }

  remove(agentId: string): void {
    this.agents.delete(agentId);
  }

  get(agentId: string): LoreAgent | undefined {
    return this.agents.get(agentId);
  }

  getAll(): LoreAgent[] {
    return Array.from(this.agents.values());
  }

  getRunning(): LoreAgent[] {
    return this.getAll().filter(agent => agent.getState().status === 'running');
  }

  getCompleted(): LoreAgent[] {
    return this.getAll().filter(agent => agent.getState().status === 'completed');
  }

  getFailed(): LoreAgent[] {
    return this.getAll().filter(agent => agent.getState().status === 'failed');
  }

  canRunMore(): boolean {
    return this.getRunning().length < this.maxConcurrent;
  }

  async runNext(): Promise<void> {
    if (!this.canRunMore()) {
      return;
    }

    const idle = this.getAll().find(agent => agent.getState().status === 'idle');
    if (idle) {
      await idle.run();
    }
  }

  async runAll(): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    
    for (const agent of this.getAll()) {
      if (agent.getState().status === 'idle') {
        const result = await agent.run();
        results.push(result);
      }
    }
    
    return results;
  }

  pauseAll(): void {
    this.getRunning().forEach(agent => agent.pause());
  }

  resumeAll(): void {
    this.getAll()
      .filter(agent => agent.getState().status === 'paused')
      .forEach(agent => agent.resume());
  }

  clear(): void {
    this.agents.clear();
  }

  size(): number {
    return this.agents.size;
  }
}