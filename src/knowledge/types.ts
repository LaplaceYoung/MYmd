export interface KnowledgeHeadingInput {
  level: number;
  text: string;
  slug: string;
  line_no: number;
}

export interface KnowledgeWikilinkInput {
  raw_text: string;
  to_doc_path: string;
  to_heading_slug: string;
  alias_text: string;
}

export interface KnowledgeUpsertPayload {
  file_path: string;
  title: string;
  content: string;
  mtime: number;
  headings: KnowledgeHeadingInput[];
  wikilinks: KnowledgeWikilinkInput[];
  tags: string[];
}

export interface KnowledgeDocumentHit {
  file_path: string;
  title: string;
  preview: string;
}

export interface KnowledgeHeadingHit {
  file_path: string;
  document_title: string;
  heading_text: string;
  heading_slug: string;
  level: number;
}

export interface KnowledgeTagHit {
  file_path: string;
  document_title: string;
  tag: string;
}

export interface KnowledgeSearchResponse {
  documents: KnowledgeDocumentHit[];
  headings: KnowledgeHeadingHit[];
  tags: KnowledgeTagHit[];
}

export interface KnowledgeBacklinkItem {
  from_file_path: string;
  from_title: string;
  raw_text: string;
  to_heading_slug: string;
  snippet: string;
  matched_heading_text: string;
  updated_at: number;
}

export interface KnowledgeUnlinkedMentionItem {
  from_file_path: string;
  from_title: string;
  mention_text: string;
  snippet: string;
  updated_at: number;
}

export interface KnowledgeGraphNode {
  id: string;
  title: string;
  file_path: string;
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  raw_text: string;
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}
