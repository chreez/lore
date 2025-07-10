import { AgentContext } from '../types';
import { LoreAgent } from './base';

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