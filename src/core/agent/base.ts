import { 
  AgentState, 
  AgentContext, 
  AgentResult, 
  LoreError
} from '../types';
import { createId } from '../utils/id';
import { LoreErrorHandler } from '../errors';

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
    // eslint-disable-next-line no-console
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