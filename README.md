# Lore

**Autonomous research system that gathers, verifies, and connects information from multiple sources while maintaining full traceability.**

Every claim is linked to its source, making research suitable for business plans, investor decks, and critical decision-making.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd lore

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npm run db:migrate

# Run tests
npm test

# Start development server
npm run dev
```

## 🎯 What is Lore?

Lore is an autonomous research system designed to:

- **Gather** information from YouTube, web pages, PDFs, and academic papers
- **Verify** content through cross-referencing and confidence scoring
- **Connect** related information to build comprehensive knowledge graphs
- **Trace** every claim back to its original source with timestamps
- **Export** research in multiple formats (Obsidian, JSON, academic formats)

### Key Features

- **🔍 Multi-Source Research**: YouTube videos, web articles, PDFs, academic papers
- **🧠 AI-Powered Processing**: Uses Claude 3.5 Sonnet for intelligent content analysis
- **📊 Knowledge Graphs**: Visualize connections between ideas and sources
- **⚡ Real-Time Processing**: Stream research results as they're discovered
- **🔗 Full Traceability**: Every note links back to its source with confidence scores
- **💾 Local-First**: Option to run entirely on-premises with SQLite
- **📱 Multiple Interfaces**: CLI, web UI, and API access

## 🏗️ Architecture

### 12-Factor Agents Methodology

Lore follows the **12-Factor Agents** methodology for autonomous system design:

1. **One Tool, One Function** - Each agent has a single, clear purpose
2. **Code Ownership** - Agents generate complete, editable implementations
3. **Context Management** - Intelligent handling of LLM context windows
4. **Tool Registry** - Dynamic agent discovery and composition
5. **Separate Execution/Business State** - Clean separation of concerns
6. **Observable** - Complete audit trail of all operations
7. **Human Integration** - Approval workflows and monitoring
8. **Explicit Control Flow** - No hidden abstractions or magic
9. **Compact Errors** - Actionable error messages with recovery suggestions
10. **Configuration** - Environment-based configuration management
11. **Monitoring** - Built-in cost tracking and performance metrics
12. **Stateless** - Agents as pure functions, fully resumable

### Agent Types

- **🎯 Orchestrator**: Parses queries, spawns scrapers, manages workflow
- **📥 Scrapers**: YouTube, web, PDF, academic paper data collection
- **⚙️ Processors**: Convert raw content to atomic notes, find connections
- **📤 Generators**: Create outputs in various formats

## 🛠️ Technology Stack

- **Backend**: TypeScript with Node.js
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: React with TanStack libraries (Router, Query, Table, Virtual)
- **Styling**: Tailwind CSS
- **LLM**: Claude 3.5 Sonnet for orchestration and processing
- **Storage**: Zettelkasten markdown files (Obsidian-compatible)

## 📁 Project Structure

```
lore/
├── src/
│   ├── core/              # Agent framework and utilities
│   │   ├── agent/         # Base agent classes and management
│   │   ├── utils/         # Shared utilities (ID generation, validation)
│   │   ├── config.ts      # Configuration management
│   │   ├── types.ts       # Core type definitions
│   │   └── errors.ts      # Error handling patterns
│   ├── agents/            # Agent implementations
│   │   ├── orchestrator/  # Research orchestrator
│   │   ├── scrapers/      # Data collection agents
│   │   ├── processors/    # Content processing agents
│   │   └── generators/    # Output generation agents
│   ├── storage/           # Database and file system interfaces
│   ├── web/               # Web interface components
│   └── api/               # REST API endpoints
├── docs/                  # Documentation
│   ├── planning/          # Project plans and decisions
│   ├── specifications/    # Requirements and specifications
│   └── summaries/         # Progress reports
├── tests/                 # Test files
└── scripts/               # Setup and deployment scripts
```

## 🚦 Current Status

**Phase**: Foundation (Week 1-2) ✅ **COMPLETED**

### ✅ Completed
- [x] TypeScript project with strict configuration
- [x] SQLite database schema with full table structure
- [x] Agent framework following 12-Factor principles
- [x] Comprehensive error handling with recovery patterns
- [x] Testing infrastructure with Jest and mock agents
- [x] Code architecture refactoring and file size enforcement
- [x] Module extraction and utility organization

### 🔄 In Progress
- Orchestrator agent implementation
- Agent state management and audit logging
- Context management system

### 📋 Next Steps
See [`docs/planning/PROJECT_PLAN.md`](docs/planning/PROJECT_PLAN.md) for detailed timeline and milestones.

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key

### Environment Variables

```bash
# LLM Configuration
ANTHROPIC_API_KEY=your_api_key_here
LLM_MODEL=claude-3-5-sonnet-20241022

# Database
DATABASE_TYPE=sqlite
DATABASE_URL=lore.db

# Storage
ZETTELKASTEN_PATH=./zettelkasten
AUDIT_LOG_PATH=./audit_logs

# Rate Limits
YOUTUBE_RATE_LIMIT=10
WEB_RATE_LIMIT=30
ACADEMIC_RATE_LIMIT=5

# Defaults
DEFAULT_COST_LIMIT=15
DEFAULT_DEPTH_LIMIT=2
DEFAULT_MAX_TOKENS=4000
```

### Available Scripts

```bash
npm run dev          # Start development server with watch mode
npm run build        # Build for production
npm start            # Start production server
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint         # Run ESLint (enforces file size limits)
npm run typecheck    # TypeScript type checking
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database and run migrations
```

### Code Standards

- **File Size Limit**: 200 lines per file (enforced by ESLint)
- **Function Size**: 50 lines per function (warning)
- **Complexity**: Maximum 10 (warning)
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Testing**: >80% code coverage required

### Git Workflow

- **Atomic commits**: ≤300 lines of code changes per commit
- **Branch naming**: `research/{session_id}` for research sessions
- **Commit messages**: Clear, descriptive messages explaining the "why"
- **Project plan updates**: Always commit PROJECT_PLAN.md changes with related code

## 📖 Documentation

- **[Product Requirements](docs/specifications/research-system-prd.md)** - Complete feature specifications
- **[Project Plan](docs/planning/PROJECT_PLAN.md)** - Implementation timeline and task tracking
- **[Architecture Decisions](docs/planning/REFACTORING_DECISIONS.md)** - Design rationale and library choices
- **[Development Guide](CLAUDE.md)** - Detailed development guidelines and patterns

## 🎯 Design Principles

### Core Values
- **Traceability**: Every claim links to source with timestamp
- **No Hallucinations**: All content from real sources
- **Context Optimization**: Intelligent context management for LLMs
- **Open Standards**: Export everything, no lock-in
- **Local-First**: Option to run entirely on-premises

### Code Philosophy: "Less Code is More"
- **Leverage existing solutions**: Don't reinvent Claude, LLMs, or established patterns
- **Small, focused files**: Each module readable in one screen (<200 lines)
- **Human readability first**: Clear, self-documenting code over clever abstractions
- **Minimal dependencies**: Use built-in Node.js/browser APIs when possible
- **Composition over inheritance**: Small, composable functions and components

## 🔒 Constraints

- **Cost Limit**: Default $15 per research session
- **Rate Limits**: YouTube (10/min), Web (30/min), Academic (5/min)
- **Storage**: 10GB default quota per user
- **Performance**: <30 minute research completion target
- **Context Window**: Optimized for serial position effect

## 🤝 Contributing

1. **Read the development guidelines** in `CLAUDE.md`
2. **Check the project plan** in `docs/planning/PROJECT_PLAN.md`
3. **Follow the code standards** enforced by ESLint
4. **Write tests** for new functionality
5. **Update documentation** as needed

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub issues
- **Documentation**: Check `docs/` directory for detailed guides
- **Development**: See `CLAUDE.md` for comprehensive development instructions

---

**Note**: This project is in active development. The API and features may change rapidly during the initial phases. See the project plan for current status and upcoming milestones.