/**
 * Lore API Interfaces v1.0.0
 * 
 * Shared type definitions for communication between Lore core engine
 * and external tools (lore-web, lore-obsidian, etc.)
 * 
 * External repos should reference this file and specify version compatibility.
 */

export const LORE_API_VERSION = "1.0.0";

// Core Data Types
export interface LoreNote {
  id: string;                    // YYYYMMDD-HHMMSS-topic-subtopic
  content: string;
  created_at: string;            // ISO timestamp
  source_id: string;
  confidence: number;            // 0-1
  note_type: 'atomic' | 'synthesis' | 'question';
  tags: LoreTag[];
  content_types: LoreContentType[];
}

export interface LoreSource {
  id: string;
  url: string;
  title?: string;
  author?: string;
  content_date?: string;         // ISO timestamp
  scraped_at: string;            // ISO timestamp
  scraper_tool: string;
  extraction_method?: string;
  raw_content?: string;
}

export interface LoreTag {
  id: number;
  tag_name: string;
  tag_type: 'content' | 'quality' | 'domain' | 'method';
}

export interface LoreContentType {
  type: 'FACT' | 'OPINION' | 'DATA' | 'CLAIM' | 'QUESTION';
}

export interface LoreNoteLink {
  from_note_id: string;
  to_note_id: string;
  link_type: 'supports' | 'contradicts' | 'extends' | 'questions';
}

export interface LoreResearchSession {
  id: string;
  topic: string;
  started_at: string;            // ISO timestamp
  completed_at?: string;         // ISO timestamp
  depth_limit: number;
  status: 'running' | 'completed' | 'failed';
  progress?: LoreSessionProgress;
}

export interface LoreSessionProgress {
  current_phase: string;
  agents_active: number;
  sources_scraped: number;
  notes_generated: number;
  estimated_completion?: string; // ISO timestamp
}

// API Request/Response Types
export interface StartResearchRequest {
  topic: string;
  depth_limit?: number;
  source_types?: string[];
  tags?: string[];
  cost_limit?: number;
}

export interface StartResearchResponse {
  session_id: string;
  estimated_time: number;        // minutes
  estimated_cost: number;        // USD
}

export interface SearchNotesRequest {
  query?: string;
  tags?: string[];
  types?: LoreContentType['type'][];
  date_range?: {
    start: string;               // ISO timestamp
    end: string;                 // ISO timestamp
  };
  confidence_min?: number;
  limit?: number;
  offset?: number;
}

export interface SearchNotesResponse {
  notes: LoreNote[];
  total: number;
  facets: {
    tags: Array<{ tag: string; count: number }>;
    types: Array<{ type: string; count: number }>;
    sources: Array<{ source: string; count: number }>;
  };
}

export interface NoteContextRequest {
  note_id: string;
  max_tokens?: number;
  include_linked?: boolean;
  depth?: number;
}

export interface NoteContextResponse {
  context: string;
  token_count: number;
  linked_notes: string[];       // note IDs
}

export interface ExportRequest {
  format: 'json' | 'markdown' | 'csv' | 'obsidian';
  note_ids?: string[];
  session_id?: string;
  options?: Record<string, any>;
}

export interface ExportResponse {
  download_url?: string;
  content?: string;
  metadata: {
    format: string;
    note_count: number;
    generated_at: string;       // ISO timestamp
  };
}

// Knowledge Graph Types
export interface LoreGraphNode {
  id: string;                   // note_id
  label: string;
  type: LoreNote['note_type'];
  confidence: number;
  tags: string[];
  x?: number;                   // for positioning
  y?: number;
}

export interface LoreGraphEdge {
  source: string;               // note_id
  target: string;               // note_id
  type: LoreNoteLink['link_type'];
  weight?: number;
}

export interface LoreGraphData {
  nodes: LoreGraphNode[];
  edges: LoreGraphEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    generated_at: string;
  };
}

// Error Types
export interface LoreError {
  type: string;
  message: string;
  context?: string;
  suggestion?: string;
  agent?: string;
  can_retry: boolean;
  timestamp: string;            // ISO timestamp
}

// Real-time Event Types (for WebSocket/SSE)
export interface LoreEvent {
  type: 'progress' | 'completion' | 'error' | 'note_created' | 'link_discovered';
  session_id: string;
  timestamp: string;            // ISO timestamp
  data: any;
}

export interface LoreProgressEvent extends LoreEvent {
  type: 'progress';
  data: LoreSessionProgress;
}

export interface LoreNoteCreatedEvent extends LoreEvent {
  type: 'note_created';
  data: {
    note: LoreNote;
    source: LoreSource;
  };
}

// Configuration Types
export interface LoreConfig {
  api_version: string;
  base_url: string;             // e.g., "http://localhost:3000"
  auth?: {
    type: 'api_key' | 'none';
    token?: string;
  };
  rate_limits: {
    requests_per_minute: number;
    concurrent_sessions: number;
  };
}

// External Tool Integration
export interface LoreIntegration {
  name: string;                 // e.g., "lore-web", "lore-obsidian"
  version: string;              // semver
  api_version: string;          // compatible Lore API version
  endpoints_used: string[];     // list of API endpoints used
  features: string[];           // list of features supported
}