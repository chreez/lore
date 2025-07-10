import { 
  ResearchSession, 
  AgentResult
} from './types';
import { LoreConfig } from './config';
import { createId } from './utils/id';
import { AgentFactory, AgentPool } from './agent/index';
import { LoreErrorHandler } from './errors';

// Main Agent Loop (Factor 8: Explicit control flow)
export class LoreExecutor {
  private config: LoreConfig;
  private agentPool: AgentPool;
  private session: ResearchSession | null = null;

  constructor(config: LoreConfig) {
    this.config = config;
    this.agentPool = new AgentPool(5); // Max 5 concurrent agents
  }

  // Create a new research session
  async createSession(topic: string, options: {
    depthLimit?: number;
    costLimit?: number;
  } = {}): Promise<ResearchSession> {
    const session: ResearchSession = {
      id: createId(),
      topic,
      startedAt: new Date(),
      depthLimit: options.depthLimit || this.config.defaults.depthLimit,
      status: 'running',
      agents: [],
      costEstimate: 0,
      costLimit: options.costLimit || this.config.defaults.costLimit,
    };

    this.session = session;
    return session;
  }

  // Get current session
  getSession(): ResearchSession | null {
    return this.session;
  }

  // Execute a research session
  async executeSession(sessionId: string): Promise<AgentResult[]> {
    if (!this.session || this.session.id !== sessionId) {
      throw LoreErrorHandler.create({
        type: 'validation',
        message: 'Invalid session ID',
        context: `Session ID: ${sessionId}`,
        suggestion: 'Create a new session or use existing session ID',
        agent: 'executor',
        canRetry: false,
      });
    }

    try {
      this.session.status = 'running';
      
      // Phase 1: Initialize orchestrator
      const orchestrator = AgentFactory.createAgent(
        'orchestrator', 
        this.session.id,
        { maxTokens: this.config.defaults.maxTokens }
      );
      
      this.agentPool.add(orchestrator);
      
      // Phase 2: Run orchestrator to spawn other agents
      const orchestratorResult = await orchestrator.run();
      
      if (!orchestratorResult.success) {
        this.session.status = 'failed';
        return [orchestratorResult];
      }

      // Phase 3: Run all agents in parallel (within limits)
      const results = await this.agentPool.runAll();
      
      // Phase 4: Determine final status
      const hasFailures = results.some(result => !result.success);
      this.session.status = hasFailures ? 'failed' : 'completed';
      this.session.completedAt = new Date();
      
      // Update cost estimate
      this.session.costEstimate = results.reduce((total, result) => total + result.cost, 0);
      
      return results;
      
    } catch (error) {
      this.session.status = 'failed';
      this.session.completedAt = new Date();
      
      const loreError = LoreErrorHandler.fromError(
        error as Error,
        AgentFactory.createContext(this.session.id)
      );
      
      return [{
        success: false,
        error: loreError,
        tokensUsed: 0,
        cost: 0,
        duration: 0,
        metadata: {},
      }];
    }
  }

  // Pause session
  pauseSession(): void {
    if (this.session) {
      this.session.status = 'paused';
      this.agentPool.pauseAll();
    }
  }

  // Resume session
  resumeSession(): void {
    if (this.session) {
      this.session.status = 'running';
      this.agentPool.resumeAll();
    }
  }

  // Cancel session
  cancelSession(): void {
    if (this.session) {
      this.session.status = 'failed';
      this.session.completedAt = new Date();
      this.agentPool.clear();
    }
  }

  // Get session progress
  getProgress(): { progress: number; details: string } {
    if (!this.session) {
      return { progress: 0, details: 'No active session' };
    }

    const agents = this.agentPool.getAll();
    if (agents.length === 0) {
      return { progress: 0, details: 'Initializing...' };
    }

    const totalProgress = agents.reduce((sum, agent) => sum + agent.getState().progress, 0);
    const averageProgress = totalProgress / agents.length;
    
    const running = this.agentPool.getRunning().length;
    const completed = this.agentPool.getCompleted().length;
    const failed = this.agentPool.getFailed().length;
    
    return {
      progress: averageProgress,
      details: `Running: ${running}, Completed: ${completed}, Failed: ${failed}`,
    };
  }

  // Get agent states
  getAgentStates(): Array<{ id: string; type: string; status: string; progress: number }> {
    return this.agentPool.getAll().map(agent => {
      const state = agent.getState();
      return {
        id: state.id,
        type: state.type,
        status: state.status,
        progress: state.progress,
      };
    });
  }

  // Cost management
  checkCostLimit(): boolean {
    if (!this.session) return true;
    return this.session.costEstimate < this.session.costLimit;
  }

  updateCostEstimate(additionalCost: number): void {
    if (this.session) {
      this.session.costEstimate += additionalCost;
    }
  }

  // Cleanup
  cleanup(): void {
    this.agentPool.clear();
    this.session = null;
  }
}

// Session Manager for multiple sessions
export class SessionManager {
  private sessions: Map<string, LoreExecutor> = new Map();
  private config: LoreConfig;

  constructor(config: LoreConfig) {
    this.config = config;
  }

  async createSession(topic: string, options: {
    depthLimit?: number;
    costLimit?: number;
  } = {}): Promise<{ sessionId: string; executor: LoreExecutor }> {
    const executor = new LoreExecutor(this.config);
    const session = await executor.createSession(topic, options);
    
    this.sessions.set(session.id, executor);
    
    return { sessionId: session.id, executor };
  }

  getSession(sessionId: string): LoreExecutor | undefined {
    return this.sessions.get(sessionId);
  }

  async executeSession(sessionId: string): Promise<AgentResult[]> {
    const executor = this.sessions.get(sessionId);
    if (!executor) {
      throw LoreErrorHandler.create({
        type: 'validation',
        message: 'Session not found',
        context: `Session ID: ${sessionId}`,
        suggestion: 'Create a new session or use existing session ID',
        agent: 'session-manager',
        canRetry: false,
      });
    }

    return executor.executeSession(sessionId);
  }

  listSessions(): Array<{ id: string; topic: string; status: string }> {
    return Array.from(this.sessions.entries()).map(([id, executor]) => {
      const session = executor.getSession();
      return {
        id,
        topic: session?.topic || 'Unknown',
        status: session?.status || 'Unknown',
      };
    });
  }

  removeSession(sessionId: string): void {
    const executor = this.sessions.get(sessionId);
    if (executor) {
      executor.cleanup();
      this.sessions.delete(sessionId);
    }
  }

  cleanup(): void {
    for (const executor of this.sessions.values()) {
      executor.cleanup();
    }
    this.sessions.clear();
  }
}