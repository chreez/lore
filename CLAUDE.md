# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lore** is an autonomous research system that gathers, verifies, and connects information from multiple sources while maintaining full traceability. Every claim is linked to its source, making research suitable for business plans, investor decks, and critical decision-making.

## Current State

This codebase is in the **planning/specification phase** with comprehensive documentation but no implementation code yet. The next phase is implementing the core architecture.

## Technology Stack (Planned)

- **Backend**: TypeScript with Node.js
- **Database**: SQLite for development, PostgreSQL for production  
- **Frontend**: React with TanStack libraries (Router, Query, Table, Virtual)
- **Styling**: Tailwind CSS
- **LLM**: Claude 3.5 Sonnet for orchestration and processing
- **Storage**: Zettelkasten markdown files (Obsidian-compatible)

## Architecture Patterns

### 12-Factor Agents Methodology
Each agent follows core principles:
- One tool/one function per agent
- Stateless design (agents as pure functions)
- Explicit control flow with no hidden abstractions
- Full code ownership (generate complete, editable source)
- Human-in-the-loop integration as first-class operation

### Agent-Based System
- **Orchestrator Agent**: Parse queries, spawn scrapers, manage workflow
- **Scraper Agents**: YouTube, web, PDF, academic paper scrapers
- **Processor Agents**: Convert raw content to atomic notes, find connections
- **Generator Agents**: Create web interface, export formats

## Development Guidelines

### Code Philosophy - "Less Code is More"
- **Leverage existing solutions**: Don't reinvent Claude, LLMs, or established patterns
- **Small, focused files**: Each module should be readable in one screen (aim for <200 lines)
- **Extract when necessary**: Break into secondary modules when complexity grows
- **Human readability first**: Clear, self-documenting code over clever abstractions
- **Minimal dependencies**: Use built-in Node.js/browser APIs when possible
- **Composition over inheritance**: Small, composable functions and components

### Code Style
- TypeScript with strict mode enabled
- Functional React components
- Explicit error handling (no thrown exceptions in agents)
- Prefix interfaces with `Lore` (e.g., `LoreNote`, `LoreAgent`)
- No spaces in filenames (use hyphens)
- Maximum file size: 200-300 lines (extract to modules beyond this)

### Git Workflow & Commit Standards
- Agents create commits at each research phase
- Branch per research session: `research/{session_id}`
- Merge to main upon completion
- Tag completed research: `lore-{topic}-{date}`
- **Commit Size Rule**: Each commit should contain ≤300 lines of code changes
- **Atomic Commits**: Break large changes into multiple logical commits
- **Commit Messages**: Clear, descriptive messages explaining the "why"
- **Project Plan Correlation**: Every completed task in PROJECT_PLAN.md must have a corresponding commit

### Project Plan Maintenance
- **ALWAYS** update PROJECT_PLAN.md when completing tasks
- Mark completed items with `[x]` as they're finished
- Add discovered tasks or adjustments to the plan in real-time
- Update timelines if tasks take longer than expected
- Document blockers or dependencies as they're discovered
- Keep the plan as the single source of truth for project status
- **Commit Rule**: After marking tasks complete, commit both code changes and PROJECT_PLAN.md updates together
- **Commit Message Format**: `feat: [task description] (completes Week X task)`

### File Naming Conventions
- Zettelkasten notes: `YYYYMMDD-HHMMSS-topic-subtopic.md`
- Use hyphens instead of spaces
- Lowercase preferred for consistency

### Error Handling Pattern
```typescript
interface LoreError {
  type: string;        // Error category
  message: string;     // User-friendly message
  context: string;     // Debugging context
  suggestion: string;  // Recovery action
  agent: string;       // Which agent failed
  canRetry: boolean;   // Retry possible
}
```

## Planned Project Structure

```
lore/
├── src/
│   ├── core/                # Main agent loop and state management
│   ├── agents/              # Agent implementations
│   │   ├── orchestrator/    # Research orchestrator
│   │   ├── scrapers/        # YouTube, web, PDF, academic scrapers
│   │   ├── processors/      # Note processing and linking
│   │   └── generators/      # Output generation
│   ├── prompts/             # Version-controlled LLM prompts
│   ├── storage/             # Zettelkasten and database interfaces
│   ├── web/                 # TanStack-based UI components
│   └── api/                 # REST API endpoints
├── tests/                   # Unit, integration, and E2E tests
├── config/                  # Configuration files
└── scripts/                 # Setup and deployment scripts
```

## Database Schema

Key tables:
- `notes`: Atomic notes with source links and confidence scores
- `sources`: Complete source tracking with metadata
- `note_links`: Relationships between notes (supports, contradicts, extends)
- `research_sessions`: Research workflow tracking
- `audit_log`: Complete trace of all operations

## Testing Requirements

- Unit tests: >80% code coverage
- Integration tests: All agent interactions
- E2E tests: Complete research workflows
- Prompt effectiveness tests: >70% prompt success rate
- Mock LLM responses for consistent testing

## Important Constraints

- **Cost Limit**: Default $15 per research session
- **Rate Limits**: YouTube (10/min), Web (30/min), Academic (5/min)
- **Storage**: 10GB default quota per user
- **Performance**: <30 minute research completion target
- **Context Window**: Optimize for serial position effect

## Planned CLI Commands

```bash
# Initialize new research
lore start "market analysis for sustainable packaging"

# Check status
lore status <session-id>

# Query knowledge base
lore query "what are the main trends?"

# Export for LLM context
lore export context --topic "packaging trends" --tokens 50000

# Manage agents
lore agents list
lore agents pause youtube-scraper
```

## Implementation Priority

### Phase 1 (MVP)
1. Set up basic project structure with package.json
2. Implement core agent framework 
3. Build basic scrapers (YouTube, web, PDF)
4. Create database schema and migrations
5. Implement note processing system
6. Build web interface with TanStack libraries

### Phase 2 (Beta)
- All planned scrapers implemented
- Full graph visualization
- Human-in-the-loop workflows
- Production monitoring

## Key Design Principles

- **Traceability**: Every claim links to source with timestamp
- **No Hallucinations**: All content from real sources
- **Context Optimization**: Intelligent context management for LLMs
- **Open Standards**: Export everything, no lock-in
- **Local-First**: Option to run entirely on-premises

## Development Commands

When implementation begins, commands will likely include:
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm test` - Run test suite
- `npm run build` - Build for production
- `npm run lint` - Code linting
- `npm run typecheck` - TypeScript type checking

## Documentation References

- `research-system-prd.md` - Complete product requirements and specifications
- `lore-claude-context.md` - Development guidelines and project context