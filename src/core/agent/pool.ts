import { AgentResult } from '../types';
import { LoreAgent } from './base';

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