// Mock implementations for testing
import { LoreAgent, AgentRegistry } from '../core/agent';
import { AgentContext, AgentResult } from '../core/types';

// Mock Orchestrator Agent
export class MockOrchestratorAgent extends LoreAgent {
  constructor(context: AgentContext) {
    super('orchestrator', context);
  }

  get purpose(): string {
    return 'Mock orchestrator for testing';
  }

  async execute(): Promise<AgentResult> {
    this.log('Mock orchestrator executing');
    this.updateProgress(0.5);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.updateProgress(1.0);
    
    return this.success({
      plan: 'Test research plan',
      scrapers: ['youtube', 'web'],
    });
  }
}

// Mock Scraper Agent
export class MockScraperAgent extends LoreAgent {
  constructor(context: AgentContext) {
    super('scraper', context);
  }

  get purpose(): string {
    return 'Mock scraper for testing';
  }

  async execute(): Promise<AgentResult> {
    this.log('Mock scraper executing');
    this.updateProgress(0.3);
    
    // Simulate scraping
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.updateProgress(0.7);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 30));
    
    this.updateProgress(1.0);
    
    return this.success({
      sources: [
        {
          id: 'test-source-1',
          url: 'https://example.com/test',
          title: 'Test Article',
          content: 'Test content for analysis',
          scrapedAt: new Date(),
        },
      ],
    });
  }
}

// Mock Processor Agent
export class MockProcessorAgent extends LoreAgent {
  constructor(context: AgentContext) {
    super('processor', context);
  }

  get purpose(): string {
    return 'Mock processor for testing';
  }

  async execute(): Promise<AgentResult> {
    this.log('Mock processor executing');
    this.updateProgress(0.2);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 80));
    
    this.updateProgress(0.8);
    
    // Simulate note generation
    await new Promise(resolve => setTimeout(resolve, 20));
    
    this.updateProgress(1.0);
    
    return this.success({
      notes: [
        {
          id: 'test-note-1',
          content: 'Test atomic note content',
          tags: ['test', 'mock'],
          confidence: 0.8,
          noteType: 'atomic',
        },
      ],
    });
  }
}

// Mock Generator Agent
export class MockGeneratorAgent extends LoreAgent {
  constructor(context: AgentContext) {
    super('generator', context);
  }

  get purpose(): string {
    return 'Mock generator for testing';
  }

  async execute(): Promise<AgentResult> {
    this.log('Mock generator executing');
    this.updateProgress(0.4);
    
    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 60));
    
    this.updateProgress(1.0);
    
    return this.success({
      outputs: [
        {
          type: 'markdown',
          path: './test-output.md',
          content: '# Test Output\n\nGenerated test content',
        },
      ],
    });
  }
}

// Mock Failing Agent
export class MockFailingAgent extends LoreAgent {
  constructor(context: AgentContext) {
    super('scraper', context);
  }

  get purpose(): string {
    return 'Mock failing agent for testing error handling';
  }

  async execute(): Promise<AgentResult> {
    this.log('Mock failing agent executing');
    this.updateProgress(0.5);
    
    // Simulate failure
    throw new Error('Mock agent failure for testing');
  }
}

// Register mock agents
export function registerMockAgents(): void {
  AgentRegistry.register('orchestrator', MockOrchestratorAgent);
  AgentRegistry.register('scraper', MockScraperAgent);
  AgentRegistry.register('processor', MockProcessorAgent);
  AgentRegistry.register('generator', MockGeneratorAgent);
  AgentRegistry.register('failing', MockFailingAgent);
}

// Mock LLM API responses
export const mockLLMAPI = {
  orchestrator: {
    message: {
      role: 'assistant',
      content: JSON.stringify({
        plan: 'Test research plan',
        scrapers: ['youtube', 'web'],
        depth: 2,
      }),
    },
    usage: {
      input_tokens: 150,
      output_tokens: 75,
    },
  },
  
  scraper: {
    message: {
      role: 'assistant',
      content: JSON.stringify({
        sources: [
          {
            url: 'https://example.com/test',
            title: 'Test Article',
            content: 'Test content for analysis',
            confidence: 0.8,
          },
        ],
      }),
    },
    usage: {
      input_tokens: 200,
      output_tokens: 100,
    },
  },
  
  processor: {
    message: {
      role: 'assistant',
      content: JSON.stringify({
        notes: [
          {
            id: 'test-note-1',
            content: 'Test atomic note',
            tags: ['test'],
            confidence: 0.8,
            noteType: 'atomic',
          },
        ],
        links: [
          {
            from: 'test-note-1',
            to: 'test-note-2',
            type: 'supports',
            strength: 0.7,
          },
        ],
      }),
    },
    usage: {
      input_tokens: 300,
      output_tokens: 150,
    },
  },
};

// Mock database operations
export const mockDatabase = {
  notes: new Map(),
  sources: new Map(),
  sessions: new Map(),
  
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
  transaction: jest.fn((fn) => fn()),
  
  reset(): void {
    this.notes.clear();
    this.sources.clear();
    this.sessions.clear();
    jest.clearAllMocks();
  },
};

// Mock file system operations
export const mockFileSystem = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  exists: jest.fn(),
  
  reset(): void {
    jest.clearAllMocks();
  },
};