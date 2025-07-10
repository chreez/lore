import { LoreError, LoreErrorSchema, AgentContext } from './types';

// Compact Error Handling following Factor 9 of 12-Factor Agents
export class LoreErrorHandler {
  static create(params: {
    type: LoreError['type'];
    message: string;
    context: string;
    suggestion: string;
    agent: string;
    canRetry?: boolean;
  }): LoreError {
    return LoreErrorSchema.parse({
      ...params,
      canRetry: params.canRetry ?? true,
    });
  }

  static fromError(error: Error, context: AgentContext): LoreError {
    // Intelligent error summarization without exposing stack traces
    const errorType = this.classifyError(error);
    const suggestion = this.getSuggestion(errorType, error);
    
    return this.create({
      type: errorType,
      message: this.sanitizeMessage(error.message),
      context: `Agent: ${context.agentId}, Session: ${context.sessionId}`,
      suggestion,
      agent: context.agentId,
      canRetry: this.isRetryable(errorType),
    });
  }

  private static classifyError(error: Error): LoreError['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'rate_limit';
    }
    
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('parse') || message.includes('invalid') || message.includes('malformed')) {
      return 'parse_error';
    }
    
    if (message.includes('database') || message.includes('sqlite') || message.includes('sql')) {
      return 'database';
    }
    
    if (message.includes('validation') || message.includes('schema')) {
      return 'validation';
    }
    
    return 'scraper_failure';
  }

  private static getSuggestion(type: LoreError['type'], _error: Error): string {
    switch (type) {
      case 'rate_limit':
        return 'Wait before retrying or request human approval to continue';
      case 'network':
        return 'Check internet connection and retry';
      case 'parse_error':
        return 'Verify source format and update parser';
      case 'database':
        return 'Check database connection and schema';
      case 'validation':
        return 'Verify input data matches expected schema';
      case 'scraper_failure':
        return 'Check source accessibility and scraper configuration';
      default:
        return 'Review error context and retry if appropriate';
    }
  }

  private static isRetryable(type: LoreError['type']): boolean {
    return ['rate_limit', 'network', 'scraper_failure'].includes(type);
  }

  private static sanitizeMessage(message: string): string {
    // Remove sensitive information like API keys, file paths, etc.
    return message
      .replace(/api[_-]?key[s]?[\s:=]+[\w\-]+/gi, 'api_key=***')
      .replace(/token[s]?[\s:=]+[\w\-]+/gi, 'token=***')
      .replace(/password[s]?[\s:=]+[\w\-]+/gi, 'password=***')
      .replace(/\/[a-zA-Z0-9\/\-._~:?#[\]@!$&'()*+,;=]+/g, '[path]')
      .substring(0, 200); // Limit message length
  }
}

// Custom error classes for specific scenarios
export class LoreAgentError extends Error {
  constructor(
    public readonly loreError: LoreError,
    message?: string
  ) {
    super(message ?? loreError.message);
    this.name = 'LoreAgentError';
  }
}

export class LoreRateLimitError extends LoreAgentError {
  constructor(agent: string, retryAfter: number) {
    const loreError = LoreErrorHandler.create({
      type: 'rate_limit',
      message: `Rate limit exceeded for ${agent}`,
      context: `Retry after ${retryAfter} seconds`,
      suggestion: 'Wait before retrying or request human approval',
      agent,
      canRetry: true,
    });
    super(loreError);
  }
}

export class LoreValidationError extends LoreAgentError {
  constructor(agent: string, field: string, value: unknown) {
    const loreError = LoreErrorHandler.create({
      type: 'validation',
      message: `Validation failed for field: ${field}`,
      context: `Invalid value: ${String(value)}`,
      suggestion: 'Verify input data matches expected schema',
      agent,
      canRetry: false,
    });
    super(loreError);
  }
}

export class LoreNetworkError extends LoreAgentError {
  constructor(agent: string, url: string, statusCode?: number) {
    const loreError = LoreErrorHandler.create({
      type: 'network',
      message: `Network error accessing ${url}`,
      context: statusCode ? `HTTP ${statusCode}` : 'Connection failed',
      suggestion: 'Check internet connection and retry',
      agent,
      canRetry: true,
    });
    super(loreError);
  }
}

// Error recovery utilities
export class ErrorRecovery {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Check if error is retryable
        if (error instanceof LoreAgentError && !error.loreError.canRetry) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
      }
    }
    
    throw lastError!;
  }

  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }
}