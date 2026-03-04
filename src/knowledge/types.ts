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

export interface KnowledgeSearchResponse {
  documents: KnowledgeDocumentHit[];
  headings: KnowledgeHeadingHit[];
}

export interface KnowledgeBacklinkItem {
  from_file_path: string;
  from_title: string;
  raw_text: string;
  to_heading_slug: string;
  updated_at: number;
}
