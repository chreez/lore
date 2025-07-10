# Lore Architecture Refactoring Decisions

## What We're NOT Building (Delegating to External Tools)

### 1. LLM Orchestration & Prompt Management
**Decision**: Use Anthropic SDK directly, no custom abstraction layers
- **Rationale**: Claude already handles context management, conversation history, and prompt optimization
- **NOT building**: Custom prompt templating systems, conversation state managers, or LLM abstractions
- **Instead**: Direct API calls with simple string templates

### 2. Web Scraping Engine
**Decision**: Use Playwright for web scraping
- **Rationale**: Mature, well-maintained library with excellent browser automation
- **NOT building**: Custom browser automation, JavaScript rendering engines, or HTML parsers
- **Instead**: `npm install playwright` when implementing scrapers

### 3. PDF Processing
**Decision**: Use pdf-parse for PDF text extraction
- **Rationale**: Simple, reliable library for extracting text from PDFs
- **NOT building**: Custom PDF parsers, OCR engines, or document processors
- **Instead**: `npm install pdf-parse` when implementing PDF scraper

### 4. YouTube Data Extraction
**Decision**: Use YouTube Data API v3 + ytdl-core for transcripts
- **Rationale**: Official API for metadata, community library for transcripts
- **NOT building**: Custom YouTube scrapers or transcript extraction
- **Instead**: `npm install googleapis ytdl-core` when implementing YouTube scraper

### 5. Semantic Search & Embeddings
**Decision**: Use OpenAI embeddings API when needed
- **Rationale**: State-of-the-art embeddings without infrastructure overhead
- **NOT building**: Custom embedding models or vector databases
- **Instead**: Simple cosine similarity for now, upgrade to vector DB later if needed

### 6. Rate Limiting
**Decision**: Use p-limit for concurrent request limiting
- **Rationale**: Battle-tested library for controlling concurrency
- **NOT building**: Custom rate limiters or queue systems
- **Instead**: `npm install p-limit` for simple concurrency control

### 7. Configuration Management
**Decision**: Use dotenv for environment variables
- **Rationale**: Standard Node.js approach for configuration
- **NOT building**: Custom config loaders or validation beyond Zod schemas
- **Instead**: `npm install dotenv` (already added)

### 8. Logging
**Decision**: Use winston for structured logging
- **Rationale**: Industry standard with excellent features
- **NOT building**: Custom logging frameworks or formatters
- **Instead**: `npm install winston` (already added)

### 9. HTTP Client
**Decision**: Use native fetch API (Node 18+)
- **Rationale**: Built into Node.js, no dependencies needed
- **NOT building**: Custom HTTP clients or request wrappers
- **Instead**: Native fetch with simple error handling

### 10. File System Operations
**Decision**: Use native Node.js fs/promises
- **Rationale**: Built-in, async-first API
- **NOT building**: Custom file managers or abstraction layers
- **Instead**: Direct fs/promises usage

## Code Organization Principles

### 1. Module Size Limits
- **Hard limit**: 200 lines per file
- **Soft target**: 100-150 lines per file
- **Exception**: Type definition files (can be slightly larger)

### 2. Single Responsibility
- Each module does ONE thing well
- If a module has "and" in its description, split it

### 3. Dependency Direction
- Core → Agents → Storage → API → UI
- Never circular dependencies
- Shared utilities in separate modules

### 4. Testing Strategy
- Unit tests for pure functions
- Integration tests for agent workflows
- Mock external services (LLM, APIs)
- No testing of third-party libraries

## Refactoring Actions Taken

### 1. Split Large Type Files
- Extracted ID utilities to `src/core/utils/id.ts`
- Moved config types to `src/core/config.ts`
- Kept domain types in `src/core/types.ts`

### 2. Simplified Agent Architecture
- Removed unnecessary abstraction layers
- Direct LLM calls instead of complex prompt systems
- Agents as simple async functions when possible

### 3. Leveraged Existing Libraries
- Added p-limit for rate limiting
- Added winston for logging (already in package.json)
- Planned additions documented above

### 4. Extracted Utilities
- ID generation utilities
- Common validation functions
- Shared error handling helpers

### 5. Removed Redundant Code
- Eliminated custom implementations where libraries exist
- Removed placeholder code that duplicates planned libraries
- Simplified overly complex patterns

## Future Considerations

When implementing new features:
1. **First**: Check if a well-maintained library exists
2. **Second**: Use the simplest approach that works
3. **Third**: Only build custom if absolutely necessary
4. **Always**: Keep modules under 200 lines

## Metrics for Success

- No file over 200 lines (except type definitions)
- Minimal custom code for solved problems
- Clear separation of concerns
- Easy to understand and modify
- Fast test execution (< 5 seconds for unit tests)