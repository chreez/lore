# Lore - Product Requirements Document

## Executive Summary

Lore is an autonomous research system that automatically gathers, verifies, and connects information from multiple sources while maintaining full traceability. Built following the 12-Factor Agents methodology for production-ready, transparent, and reliable operation.

**Important**: This PRD defines the Lore application architecture and implementation. This repository contains the source code for the Lore system itself, not research artifacts or example research outputs.

## Problem Statement

Researchers and knowledge workers lack a reliable system to automatically gather, verify, and connect information from multiple sources while maintaining full traceability of claims and sources. Current AI research tools often produce hallucinated or unverifiable information, making them unsuitable for business plans, investor decks, or critical decision-making.

## Target Users

**Primary:**
- Entrepreneurs developing business plans who need credible data
- Market analysts requiring verifiable sources for reports
- Knowledge workers building traceable research

**Secondary:**
- Content creators needing verified sources
- Students/academics doing literature reviews
- Developers needing context for PRDs/documentation

## Success Metrics

- Every claim has traceable source with timestamp
- 0% hallucinated data (all content linked to real sources)
- Time from topic → researched knowledge graph < 30 min
- Users trust the output enough to put in investor decks
- >95% successful agent executions
- >90% code ownership satisfaction
- <10% human intervention rate

## Core Features

### 1. Autonomous Research Engine
- Input: Topic/question with configurable parameters
- Follows configurable depth rules (default 2-3 levels)
- Sources: YouTube, web articles, PDFs, academic papers
- Tags: [FACT], [OPINION], [DATA], [CLAIM], [QUESTION]
- Parallel agent execution for efficiency
- **Note**: Leverages Claude/LLMs for analysis, not reimplementing AI capabilities

### 2. Traceability System
- Every piece of content → source URL + timestamp
- Scrape metadata (when captured, content date)
- Confidence scoring based on source quality
- Visual trace of complete research path
- Audit logs for all agent activities

### 3. Knowledge Output System
- Zettelkasten markdown files (Obsidian-compatible)
- Web interface for guided exploration
- API for LLM-optimized context chunks
- Filter by type/date/confidence/source
- Export to multiple formats (JSON, Markdown, PDF)
- **Note**: Output formatting delegated to existing libraries, not custom-built

## Technical Architecture

### Database Schema

```sql
-- Core note storage
CREATE TABLE notes (
    id TEXT PRIMARY KEY, -- YYYYMMDD-HHMMSS-topic-subtopic
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_id TEXT REFERENCES sources(id),
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    note_type TEXT CHECK (note_type IN ('atomic', 'synthesis', 'question'))
);

-- Source tracking
CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    author TEXT,
    content_date TIMESTAMP,
    scraped_at TIMESTAMP NOT NULL,
    scraper_tool TEXT NOT NULL,
    extraction_method TEXT,
    raw_content TEXT -- Store original for verification
);

-- Tagging system
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL,
    tag_type TEXT CHECK (tag_type IN ('content', 'quality', 'domain', 'method'))
);

CREATE TABLE note_tags (
    note_id TEXT REFERENCES notes(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (note_id, tag_id)
);

-- Content type tracking
CREATE TABLE content_types (
    note_id TEXT REFERENCES notes(id),
    type TEXT CHECK (type IN ('FACT', 'OPINION', 'DATA', 'CLAIM', 'QUESTION')),
    PRIMARY KEY (note_id, type)
);

-- Note relationships
CREATE TABLE note_links (
    from_note_id TEXT REFERENCES notes(id),
    to_note_id TEXT REFERENCES notes(id),
    link_type TEXT CHECK (link_type IN ('supports', 'contradicts', 'extends', 'questions')),
    PRIMARY KEY (from_note_id, to_note_id)
);

-- Research sessions
CREATE TABLE research_sessions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    depth_limit INTEGER DEFAULT 2,
    status TEXT CHECK (status IN ('running', 'completed', 'failed'))
);

-- Audit log
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT REFERENCES research_sessions(id),
    action TEXT NOT NULL,
    tool TEXT,
    details JSON
);
```

### Tagging System

```yaml
content_tags:
  - market_analysis
  - competitor_research
  - technical_spec
  - user_feedback
  - financial_data
  - trend_analysis

quality_tags:
  - primary_source
  - secondary_source
  - peer_reviewed
  - expert_opinion
  - crowd_sourced
  - verified
  - needs_verification

domain_tags:
  - technology
  - business
  - science
  - finance
  - social_media

method_tags:
  - direct_quote
  - paraphrased
  - synthesized
  - inferred
  - calculated
```

## Agent Architecture (12-Factor Implementation)

### Research Orchestrator Agent

```yaml
type: orchestrator
responsibilities:
  - Parse user query into research tasks
  - Spawn parallel scraper agents
  - Monitor progress and handle failures
  - Enforce depth limits
  - Manage context window optimization
implementation:
  - Factor 1: Natural language query parsing
  - Factor 5: Separate execution/business state
  - Factor 8: Explicit control flow
  - Factor 12: Stateless reducer pattern
```

### Scraper Agents

Following the **Simple Tool Creation Methodology**:

```yaml
youtube_agent:
  type: data-scraper
  max_parallel: 3
  retry_policy: exponential_backoff
  features:
    - Transcript extraction via API
    - Audio download + AI transcription fallback
    - Timestamp preservation
    - Speaker identification
  output: raw_transcripts_with_metadata

web_agent:
  type: data-scraper
  max_parallel: 5
  browser_pool_size: 3
  features:
    - JavaScript rendering (Playwright)
    - Content extraction
    - Image/diagram preservation
    - Paywall detection
  output: structured_content

pdf_agent:
  type: data-extractor
  max_parallel: 2
  features:
    - OCR for scanned documents
    - Table extraction
    - Citation parsing
    - Metadata extraction
  output: extracted_text_with_structure

academic_agent:
  type: data-scraper
  sources: [arxiv, pubmed, google_scholar]
  features:
    - Citation graph building
    - Abstract extraction
    - Author network mapping
  output: academic_papers_with_citations
```

### Processing Agents

```yaml
note_processor_agent:
  type: transformer
  responsibilities:
    - Convert raw content to atomic notes
    - Extract entities and concepts
    - Generate note IDs
    - Apply initial tags
  rules:
    - one_thought_per_note
    - max_note_length: 500_words
    - require_source_citation
    - preserve_original_context

link_discovery_agent:
  type: analyzer
  responsibilities:
    - Find connections between notes
    - Identify contradictions
    - Create relationship graph
    - Detect knowledge gaps
  algorithms:
    - semantic_similarity
    - entity_overlap
    - citation_analysis
    - temporal_correlation

verification_agent:
  type: validator
  responsibilities:
    - Cross-check facts across sources
    - Flag unsupported claims
    - Calculate confidence scores
    - Identify bias patterns
  checks:
    - source_reliability
    - claim_consistency
    - date_relevance
    - author_credibility
```

### Output Agents

```yaml
audit_agent:
  type: monitor
  responsibilities:
    - Log all scraping activities
    - Track tool usage and performance
    - Generate session summaries
    - Monitor rate limits
  outputs:
    - audit_logs/YYYYMMDD-session-{id}.json
    - performance_metrics.json
    - cost_tracking.json

export_agent:
  type: generator
  responsibilities:
    - Export notes in multiple formats
    - Generate API responses
    - Create data dumps
    - Handle format conversions
  outputs:
    - json_exports/
    - markdown_files/
    - csv_data/
    - api_responses/
```

## Project Structure

```
lore/
├── src/
│   ├── core/
│   │   ├── executor.ts         # Main agent loop (Factor 8)
│   │   ├── context.ts          # Context management (Factor 3)
│   │   ├── state.ts            # State management (Factor 5)
│   │   └── errors.ts           # Compact error handling (Factor 9)
│   ├── agents/
│   │   ├── orchestrator/       # Research orchestrator
│   │   ├── scrapers/           # All scraper agents
│   │   │   ├── youtube/
│   │   │   ├── web/
│   │   │   ├── pdf/
│   │   │   └── academic/
│   │   ├── processors/         # Processing agents
│   │   └── generators/         # Output agents
│   ├── prompts/
│   │   ├── system/             # Base agent behavior (Factor 2)
│   │   ├── extraction/         # Data extraction patterns
│   │   ├── synthesis/          # Note generation
│   │   └── validation/         # Verification prompts
│   ├── tools/
│   │   ├── registry.ts         # Tool registry (Factor 4)
│   │   └── definitions/        # Tool schemas
│   ├── storage/
│   │   ├── zettelkasten.ts     # Note file management
│   │   ├── database.ts         # SQLite interface
│   │   └── migrations/         # DB schema migrations
│   ├── triggers/
│   │   ├── http.ts             # REST API triggers (Factor 11)
│   │   ├── cli.ts              # Command line interface
│   │   └── schedule.ts         # Cron job triggers
│   ├── human/
│   │   ├── approval.ts         # Human-in-the-loop (Factor 7)
│   │   └── channels/           # Slack, email, web UI
│   ├── api/
│   │   ├── routes.ts           # REST endpoints (Factor 6)
│   │   ├── lifecycle.ts        # Agent lifecycle management
│   │   └── query.ts            # Research query endpoints
│   └── exports/
│       ├── json/               # JSON export handlers
│       ├── markdown/           # Markdown export handlers
│       └── formats/            # Other export formats
├── tests/
│   ├── unit/                   # Unit tests (>80% coverage)
│   ├── integration/            # Integration tests
│   ├── prompts/                # Prompt effectiveness tests
│   └── e2e/                    # End-to-end scenarios
├── config/
│   ├── models.yaml             # LLM configurations
│   ├── scrapers.yaml           # Scraper settings
│   ├── rate_limits.yaml        # API rate limiting
│   └── deployment.yaml         # Production config
├── docs/
│   ├── architecture.md         # System design
│   ├── agent_specs.md          # Agent specifications
│   ├── api.md                  # API documentation
│   └── deployment.md           # Production guide
└── scripts/
    ├── setup.sh                # Initial setup
    ├── migrate.sh              # Database migrations
    └── deploy.sh               # Deployment script
```

## Workflow Implementation

### Deployment Architecture

**Core Research Engine:**
**Lore Server** - Autonomous research system with CLI and REST API

Lore core engine provides:
- **REST API** - Complete research functionality via HTTP endpoints
- **CLI Interface** - Command-line research operations
- **Data Storage** - SQLite/PostgreSQL with full audit trail
- **Agent Framework** - Orchestrator, scrapers, processors

**External Tool Integration:**
- Tools reference versioned API specification (see `/docs/api/openapi.yaml`)
- Import TypeScript types from `src/interfaces/api.ts`
- Examples: lore-web (visualization), lore-obsidian (vault integration)

### User Research Workflow

```yaml
workflow:
  1_initialization:
    - user_starts_lore_server (or auto-starts via daemon)
    - user_runs: "lore start 'research topic'"
    - create_research_session_in_database
  
  2_research_phase:
    - spawn_scraper_agents(parallel=true)
    - collect_raw_content
    - store_sources_in_database
    - create_atomic_notes_in_zettelkasten_format
  
  3_processing_phase:
    - generate_atomic_notes
    - extract_entities_and_tags
    - discover_note_links
    - verify_content_claims
  
  4_synthesis_phase:
    - build_knowledge_graph
    - identify_key_insights
    - flag_contradictions
    - generate_summary_notes
  
  5_access_research:
    - view_via_web_interface (http://localhost:3000)
    - query_via_cli_commands
    - export_to_any_format (JSON, Markdown, CSV)
    - optional_sync_to_obsidian_vault
  
  6_completion:
    - research_session_complete
    - data_available_via_all_interfaces
    - user_exports_or_continues_research
```

## API Design

### Core Endpoints

```yaml
# Research Management
POST   /api/v1/research/start
  body: { topic, depth_limit, source_types[], tags[] }
  returns: { session_id, estimated_time }

GET    /api/v1/research/{session_id}/status
  returns: { status, progress, current_phase, agents_active }

POST   /api/v1/research/{session_id}/pause
POST   /api/v1/research/{session_id}/resume
DELETE /api/v1/research/{session_id}/cancel

# Knowledge Access
GET    /api/v1/notes/search
  params: { query, tags[], types[], date_range }
  returns: { notes[], total, facets }

GET    /api/v1/notes/{note_id}
  returns: { content, metadata, links, source }

GET    /api/v1/notes/{note_id}/context
  params: { max_tokens, include_linked }
  returns: { context, token_count }

POST   /api/v1/notes/query
  body: { question, context_notes[] }
  returns: { answer, sources[], confidence }

# Graph Navigation  
GET    /api/v1/graph/nodes
  params: { root_note?, depth?, filters }
  returns: { nodes[], edges[] }

GET    /api/v1/graph/path
  params: { from_note, to_note }
  returns: { path[], distance }

# Export
POST   /api/v1/export/markdown
  body: { note_ids[], format_options }
  returns: { download_url }

POST   /api/v1/export/context
  body: { topic, max_tokens, purpose }
  returns: { context, metadata }
```

## Human-in-the-Loop Integration

Following Factor 7 of 12-Factor Agents:

```yaml
approval_points:
  - rate_limited_sources:
      channels: [slack, web_ui]
      timeout: 10m
      message: "Rate limit reached for {source}. Approve wait?"
  
  - paywall_detected:
      channels: [web_ui]
      timeout: 5m
      message: "Paywall detected. Provide credentials?"
  
  - low_confidence_claim:
      channels: [slack, email]
      timeout: 30m
      message: "Low confidence claim found. Manual verification needed."
  
  - contradictory_sources:
      channels: [web_ui]
      timeout: 1h
      message: "Sources contradict. Please review and decide."
```

## Context Window Management

Following Factor 3 principles:

```yaml
optimization_strategies:
  serial_position:
    - Critical metadata at start
    - Key findings at end
    - Supporting details in middle
  
  dynamic_sizing:
    - Simple queries: 4k tokens
    - Complex research: 32k tokens
    - LLM context export: 100k tokens
  
  compression:
    - Summarize middle content
    - Preserve exact quotes
    - Maintain source links
  
  chunking:
    - Semantic boundaries
    - Max chunk: 1000 tokens
    - Overlap: 100 tokens
```

## Error Handling

Following Factor 9 - Compact Errors:

```typescript
interface CompactedError {
  type: 'scraper_failure' | 'parse_error' | 'rate_limit' | 'network';
  message: string;        // User-friendly message
  context: string;        // Relevant context for debugging
  suggestion: string;     // Recovery action
  agent: string;         // Which agent failed
  canRetry: boolean;     // Is retry possible
}

// Example implementation
class ErrorHandler {
  compact(error: Error, context: AgentContext): CompactedError {
    // Intelligent error summarization
    // No stack traces in agent context
    // Clear recovery paths
  }
}
```

## Security & Privacy

- **Local-first architecture**: Option to run entirely on-premises
- **No external dependencies**: All core features work offline
- **Encrypted storage**: Sensitive research encrypted at rest
- **Access control**: API key and role-based permissions
- **Data retention**: User-controlled with automatic cleanup
- **Audit logging**: Complete trace of all operations

## Performance Requirements

- Initial research sweep: < 5 minutes
- Graph navigation: < 1 second response
- Note search: < 500ms for 100k notes
- Concurrent research: 10+ active sessions
- Context generation: < 2 seconds
- Storage efficiency: ~1KB per atomic note

## LLM Configuration

```yaml
model_selection:
  orchestrator_agent: claude-3-5-sonnet
  note_processor_agent: claude-3-5-sonnet
  link_discovery_agent: claude-3-haiku
  verification_agent: claude-3-5-sonnet
  export_agent: claude-3-haiku

cost_management:
  default_limit: $15.00
  tracking_granularity: per_phase
  cost_estimation: total_only
  limits:
    small_research: $5.00
    medium_research: $15.00
    large_research: $50.00
    unlimited: user_accepts_costs
```

## Research Quality Scoring

```yaml
confidence_calculation:
  factors:
    source_credibility: 0.4
    corroboration_count: 0.3
    content_freshness: 0.2
    author_expertise: 0.1

source_credibility_scores:
  academic_papers: 0.9
  government_official: 0.85
  established_news: 0.7
  industry_reports: 0.7
  expert_blogs: 0.6
  general_blogs: 0.5
  forums_reddit: 0.4
  social_media: 0.3

content_freshness_scores:
  under_1_week: 1.0
  under_1_month: 0.9
  under_6_months: 0.7
  under_1_year: 0.5
  under_2_years: 0.3
  older: 0.1

conflict_handling:
  - Flag contradictions in UI
  - Maintain both pieces of information
  - Create "contradicts" relationship
  - Sort by confidence score
  - Add "disputed" tag

bias_detection: deferred_to_phase_2
```

## Data Validation

```yaml
required_fields:
  - content
  - source_url
  - scraped_at
  - scraper_tool

duplicate_detection:
  method: fuzzy_matching
  threshold: 0.85
  action: merge_metadata

validation_pipeline:
  1_schema_check: required_fields_present
  2_duplicate_check: fuzzy_matching
  3_content_validation: min_length_check
  4_metadata_extraction: best_effort
```

## Session Management

```yaml
authentication:
  local: no_auth_required
  remote: api_key_header
  
session_tracking:
  method: uuid_tokens
  storage: sqlite
  
usage_metrics:
  - total_tokens_used
  - cost_estimate
  - sources_scraped
  - notes_generated
  - time_elapsed
  - errors_encountered

multi_tenancy:
  preparation: user_id_field_all_tables
  current: single_user
  api_keys: environment_variables
```

## Backup & Recovery

```yaml
zettelkasten_backup:
  trigger: after_every_commit
  method: git_versioning
  
database_backup:
  method: sqlite_file_copy
  frequency: with_git_commits
  recovery: git_history_plus_db
  
session_recovery:
  checkpoint: after_each_agent_completes
  state_storage: sqlite
  resume_capability: full_state_restoration
  
failed_scrape_handling:
  max_retries: 3
  backoff: exponential
  max_backoff: 5_minutes
  after_max_failures: mark_unavailable
```

## Rate Limiting & Queuing

```yaml
source_rate_limits:
  youtube: 10_per_minute
  web_general: 30_per_minute
  academic: 5_per_minute
  pdf_local: unlimited

backoff_strategy:
  initial: 1_second
  multiplier: 2
  max_backoff: 300_seconds
  
queue_management:
  type: priority_queue
  priorities:
    1_user_initiated: highest
    2_depth_one: high
    3_high_confidence: medium
    4_depth_two_plus: low
    5_low_confidence: lowest
```

## Storage & Retention

```yaml
storage_quotas:
  default_limit: 10GB
  bandwidth_limits: none_mvp
  
retention_policy:
  research_data: forever
  audit_logs: 30_days_rotation
  failed_requests: 7_days
  session_state: until_completed
```

## Export Formats

```yaml
phase_1_exports:
  obsidian: standard_markdown_frontmatter
  json: complete_data_export
  academic: bibtex_only
  
future_exports:
  roam_research: on_demand
  notion_api: on_demand
  zotero: on_demand
  csv: on_demand
```

## Monitoring & Observability

```yaml
metrics:
  - agent_execution_time
  - scraper_success_rate
  - context_token_usage
  - api_response_time
  - error_rate_by_type
  - human_approval_time
  - cost_per_research_session

logging:
  - All agent state transitions
  - Tool invocations and results  
  - Human interaction points
  - Performance bottlenecks
  - Cost tracking per LLM call

alerts:
  - Agent failure rate > 5%
  - Response time > SLA
  - Cost exceeding budget
  - Human approval timeout
```

## External Tool Integration

**API-First Architecture**: External tools integrate via REST API and shared TypeScript types.

**Reference Implementation**: See `docs/api/openapi.yaml` for complete API specification.

**Shared Types**: Import from `src/interfaces/api.ts` for type-safe integration.

**Example Integrations:**
- **lore-web**: Visualization and web interface (separate repository)
- **lore-obsidian**: Obsidian vault integration (separate repository)
- **Custom Tools**: Any application can integrate via REST API

## Deployment Strategy

**Simplified for initial release:**

```yaml
development:
  - Docker Compose for all services
  - Hot reload for web interface
  - Local SQLite database

production_simple:
  - Single VPS deployment
  - Docker Compose in production
  - Nginx reverse proxy
  - Let's Encrypt SSL
  - PostgreSQL database
  - Automated backups

production_scaled:
  - Multiple VPS instances
  - Load balancer
  - Distributed agents
  - Redis for caching
  - S3-compatible storage

future_kubernetes:
  - Discover as needed
  - Start with simple deployment
  - Scale when required
```

## Testing Strategy

Following 12-Factor Agents testing principles:

```yaml
test_coverage:
  - Unit tests: >80% code coverage
  - Integration tests: All agent interactions
  - Prompt tests: >70% prompt effectiveness
  - E2E tests: Complete research workflows
  - Performance tests: Load and stress testing
  - Security tests: Penetration testing

test_scenarios:
  - Single source research
  - Multi-source contradictions
  - Rate limit handling
  - Human approval flows
  - Error recovery
  - Context optimization
```

## CLI Interface

```bash
# Server management
lore server start
lore server install-daemon  # Auto-start on macOS login
lore server stop

# Initialize new research (from any directory)
lore start "market analysis for sustainable packaging"

# Check status
lore status <session-id>

# Query knowledge base
lore query "what are the main trends?" --session <session-id>

# Export for LLM context
lore export context --topic "packaging trends" --tokens 50000

# Manage agents
lore agents list
lore agents pause youtube-scraper
lore agents logs <agent-id>
```

## Success Criteria

### Phase 1 (MVP)
- Basic research with 3 source types working
- Obsidian-compatible output
- Simple web interface
- Core API endpoints

### Phase 2 (Beta)
- All planned scrapers implemented
- Human-in-the-loop workflows
- Production monitoring
- External tool integrations

### Phase 3 (GA)
- 99.9% uptime
- <30 minute research completion
- Multi-user support
- Advanced analytics

## Appendix: Agent Creation Rules

Following the 12-Factor Agents methodology:

1. **One Tool, One Function**: Each agent does exactly one thing well
2. **Code Ownership**: Generate complete, editable source code
3. **Production Ready**: Bridge 70% demo to 100% reliability
4. **Transparent**: No hidden abstractions or magic
5. **Stateless**: Agents as pure functions
6. **Explicit Control**: Debuggable control flow
7. **Human Integration**: Approval as first-class operation
8. **Context Optimized**: Intelligent context management
9. **Error Compact**: Smart error summarization
10. **Small & Focused**: 3-10 step micro-agents
11. **Multi-Trigger**: Activate from anywhere
12. **State Separated**: Execution vs business state

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Project Name**: Lore