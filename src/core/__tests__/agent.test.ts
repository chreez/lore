import { AgentFactory, AgentRegistry, AgentPool } from '../agent';
import { registerMockAgents } from '../../test/mocks';
import { createId } from '../types';

describe('Agent Framework', () => {
  beforeAll(() => {
    registerMockAgents();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AgentFactory', () => {
    it('should create agent context with proper defaults', () => {
      const sessionId = createId();
      const context = AgentFactory.createContext(sessionId);

      expect(context.sessionId).toBe(sessionId);
      expect(context.maxTokens).toBe(4000);
      expect(context.currentTokens).toBe(0);
      expect(context.metadata).toEqual({});
    });

    it('should create agents with custom options', () => {
      const sessionId = createId();
      const metadata = { test: 'value' };
      
      const agent = AgentFactory.createAgent('orchestrator', sessionId, {
        maxTokens: 8000,
        metadata,
      });

      expect(agent.getContext().maxTokens).toBe(8000);
      expect(agent.getContext().metadata).toEqual(metadata);
    });
  });

  describe('AgentRegistry', () => {
    it('should register and create agents', () => {
      expect(AgentRegistry.has('orchestrator')).toBe(true);
      expect(AgentRegistry.has('scraper')).toBe(true);
      expect(AgentRegistry.has('nonexistent')).toBe(false);
    });

    it('should list registered agents', () => {
      const agents = AgentRegistry.list();
      expect(agents).toContain('orchestrator');
      expect(agents).toContain('scraper');
    });

    it('should throw error for unknown agent', () => {
      const sessionId = createId();
      const context = AgentFactory.createContext(sessionId);
      
      expect(() => {
        AgentRegistry.create('unknown', context);
      }).toThrow("Agent 'unknown' not found in registry");
    });
  });

  describe('Agent Execution', () => {
    it('should execute orchestrator agent successfully', async () => {
      const sessionId = createId();
      const agent = AgentFactory.createAgent('orchestrator', sessionId);

      const result = await agent.run();

      expect(result).toBeValidAgentResult();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        plan: 'Test research plan',
        scrapers: ['youtube', 'web'],
      });
    });

    it('should execute scraper agent successfully', async () => {
      const sessionId = createId();
      const agent = AgentFactory.createAgent('scraper', sessionId);

      const result = await agent.run();

      expect(result).toBeValidAgentResult();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('sources');
    });

    it('should handle agent failures gracefully', async () => {
      const sessionId = createId();
      const agent = AgentFactory.createAgent('failing', sessionId);

      const result = await agent.run();

      expect(result).toBeValidAgentResult();
      expect(result.success).toBe(false);
      expect(result.error).toBeValidLoreError();
      expect(agent.getState().status).toBe('failed');
    });

    it('should update agent state during execution', async () => {
      const sessionId = createId();
      const agent = AgentFactory.createAgent('orchestrator', sessionId);

      expect(agent.getState().status).toBe('idle');
      expect(agent.getState().progress).toBe(0);

      const resultPromise = agent.run();

      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(agent.getState().status).toBe('running');
      expect(agent.getState().progress).toBeGreaterThan(0);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(agent.getState().status).toBe('completed');
      expect(agent.getState().progress).toBe(1);
    });
  });

  describe('AgentPool', () => {
    it('should manage multiple agents', () => {
      const pool = new AgentPool(3);
      const sessionId = createId();
      
      const agent1 = AgentFactory.createAgent('orchestrator', sessionId);
      const agent2 = AgentFactory.createAgent('scraper', sessionId);
      
      pool.add(agent1);
      pool.add(agent2);

      expect(pool.size()).toBe(2);
      expect(pool.get(agent1.getState().id)).toBe(agent1);
      expect(pool.get(agent2.getState().id)).toBe(agent2);
    });

    it('should track agent states', async () => {
      const pool = new AgentPool(3);
      const sessionId = createId();
      
      const agent1 = AgentFactory.createAgent('orchestrator', sessionId);
      const agent2 = AgentFactory.createAgent('failing', sessionId);
      
      pool.add(agent1);
      pool.add(agent2);

      const results = await pool.runAll();

      expect(results).toHaveLength(2);
      expect(pool.getCompleted()).toHaveLength(1);
      expect(pool.getFailed()).toHaveLength(1);
    });

    it('should respect concurrency limits', () => {
      const pool = new AgentPool(2);
      const sessionId = createId();
      
      // Add 3 agents
      for (let i = 0; i < 3; i++) {
        const agent = AgentFactory.createAgent('orchestrator', sessionId);
        pool.add(agent);
      }

      expect(pool.size()).toBe(3);
      expect(pool.canRunMore()).toBe(true); // None are running yet
    });

    it('should pause and resume agents', () => {
      const pool = new AgentPool(3);
      const sessionId = createId();
      
      const agent = AgentFactory.createAgent('orchestrator', sessionId);
      pool.add(agent);

      agent.pause();
      expect(agent.getState().status).toBe('paused');

      agent.resume();
      expect(agent.getState().status).toBe('running');
    });
  });
});