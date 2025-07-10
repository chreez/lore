// Jest test setup file
import { LoreConfig } from '../core/config';

// Mock configuration for testing
export const mockConfig: LoreConfig = {
  database: {
    type: 'sqlite',
    connectionString: ':memory:', // In-memory database for tests
  },
  llm: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: 'test-api-key',
  },
  storage: {
    zettelkastenPath: './test-zettelkasten',
    auditLogPath: './test-audit-logs',
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
};

// Mock LLM responses
export const mockLLMResponses = {
  orchestrator: {
    success: true,
    data: {
      plan: 'Test research plan',
      scrapers: ['youtube', 'web'],
    },
  },
  scraper: {
    success: true,
    data: {
      sources: [
        {
          url: 'https://example.com/test',
          title: 'Test Article',
          content: 'Test content for analysis',
        },
      ],
    },
  },
  processor: {
    success: true,
    data: {
      notes: [
        {
          id: 'test-note-1',
          content: 'Test atomic note',
          tags: ['test'],
          confidence: 0.8,
        },
      ],
    },
  },
};

// Test utilities
export class TestUtils {
  static createMockDate(dateString: string): Date {
    return new Date(dateString);
  }

  static createMockId(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createMockError(type: string, message: string): Error {
    const error = new Error(message);
    error.name = type;
    return error;
  }
}

// Mock fetch for HTTP requests
global.fetch = jest.fn();

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
  
  // Mock console methods
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Custom Jest matchers
expect.extend({
  toBeValidLoreError(received) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => `Expected ${received} to be a valid LoreError object`,
        pass: false,
      };
    }

    const requiredFields = ['type', 'message', 'context', 'suggestion', 'agent', 'canRetry'];
    const missingFields = requiredFields.filter(field => !(field in received));

    if (missingFields.length > 0) {
      return {
        message: () => `Expected LoreError to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => `Expected ${received} not to be a valid LoreError`,
      pass: true,
    };
  },

  toBeValidAgentResult(received) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => `Expected ${received} to be a valid AgentResult object`,
        pass: false,
      };
    }

    const requiredFields = ['success', 'tokensUsed', 'cost', 'duration'];
    const missingFields = requiredFields.filter(field => !(field in received));

    if (missingFields.length > 0) {
      return {
        message: () => `Expected AgentResult to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }

    if (typeof received.success !== 'boolean') {
      return {
        message: () => `Expected success to be boolean, got ${typeof received.success}`,
        pass: false,
      };
    }

    return {
      message: () => `Expected ${received} not to be a valid AgentResult`,
      pass: true,
    };
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidLoreError(): R;
      toBeValidAgentResult(): R;
    }
  }
}