/**
 * AI Integration Types and Enumerations
 * Core type definitions for AI Builder Integration
 */

// AI Mode enumeration for different interaction modes
export enum AIMode {
  NONE = 'none',
  PROMPT = 'prompt',
  CONTINUE = 'continue',
  MODIFY = 'modify'
}

// Modification types for AI modify mode
export enum ModificationType {
  REWRITE = 'rewrite',
  EXPAND = 'expand',
  SUMMARIZE = 'summarize',
  IMPROVE_CLARITY = 'improve_clarity',
  PROMPT = 'prompt'
}

// Text selection interface for editor integration
export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

// Content insertion options for AI-generated content
export interface ContentInsertionOptions {
  insertAt: number;
  replaceRange?: { start: number; end: number };
  preserveFormatting: boolean;
}

// Document section structure for context analysis
export interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list' | 'code';
  level?: number;
  content: string;
  position: { start: number; end: number };
}

// Document context for AI processing
export interface DocumentContext {
  content: string;
  ideaDefinitions: IdeaDefinition[];
  conversationTitle: string;
  cursorPosition: number;
  selectedText?: string;
  documentStructure: DocumentSection[];
  academicContext?: AcademicContext;
}

// Idea definition interface (from existing system)
export interface IdeaDefinition {
  id: number;
  title: string;
  description: string;
  conversationid?: string; // Added conversationid
}

// AI processing state for UI feedback
export interface AIProcessingState {
  isProcessing: boolean;
  currentMode: AIMode;
  progress?: number;
  statusMessage?: string;
}

// AI Request/Response interfaces for backend handlers
export interface AIPromptRequest {
  prompt: string;
  documentContent: string;
  cursorPosition: number;
  conversationId: string;
}

export interface AIContinueRequest {
  documentContent: string;
  cursorPosition: number;
  selectedText?: string;
  conversationId: string;
}

export interface AIModifyRequest {
  selectedText: string;
  modificationType: ModificationType;
  documentContent: string;
  conversationId: string;
  customPrompt?: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    tokensUsed: number;
    processingTime: number;
    contextSufficiency?: boolean;
    styleAnalysis?: string;
    academicValidation?: AcademicValidationResult;
  };
}

// Academic context interfaces
export interface AcademicValidationResult {
  isAcademic: boolean;
  toneScore: number; // 0-1 scale
  styleIssues: string[];
  suggestions: string[];
  citationFormat: CitationFormat;
}

export interface CitationFormat {
  style: 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'IEEE' | 'Unknown';
  detected: boolean;
  examples: string[];
}

export interface ThesisStructure {
  sections: ThesisSection[];
  currentSection?: string;
  completeness: number; // 0-1 scale
}

export interface ThesisSection {
  name: string;
  level: number;
  required: boolean;
  present: boolean;
  content?: string;
  subsections?: ThesisSection[];
}

export interface AcademicContext {
  thesisStructure: ThesisStructure;
  citationFormat: CitationFormat;
  academicTone: {
    level: 'undergraduate' | 'graduate' | 'doctoral';
    discipline: string;
    formalityScore: number;
  };
  keyTerms: string[];
  researchMethodology?: string;
}

// ============================================================================
// PROOFREADER TOOL TYPES AND INTERFACES
// ============================================================================

// Proofreading concern category enumeration
export enum ConcernCategory {
  CLARITY = 'clarity',
  COHERENCE = 'coherence',
  STRUCTURE = 'structure',
  ACADEMIC_STYLE = 'academic_style',
  CONSISTENCY = 'consistency',
  COMPLETENESS = 'completeness',
  CITATIONS = 'citations',
  GRAMMAR = 'grammar',
  TERMINOLOGY = 'terminology'
}

// Proofreading concern severity enumeration
export enum ConcernSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Proofreading concern status enumeration
export enum ConcernStatus {
  TO_BE_DONE = 'to_be_done',
  ADDRESSED = 'addressed',
  REJECTED = 'rejected'
}

// Content location interface for pinpointing issues
export interface ContentLocation {
  section?: string;
  paragraph?: number;
  startPosition?: number;
  endPosition?: number;
  context?: string; // Surrounding text for reference
}

// Main proofreading concern interface
export interface ProofreadingConcern {
  id: string;
  conversationId: string;
  category: ConcernCategory;
  severity: ConcernSeverity;
  title: string;
  description: string;
  location?: ContentLocation;
  suggestions?: string[];
  relatedIdeas?: string[]; // References to idea definitions
  status: ConcernStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Analysis options for proofreader requests
export interface AnalysisOptions {
  categories?: ConcernCategory[];
  minSeverity?: ConcernSeverity;
  includeGrammar?: boolean;
  academicLevel?: 'undergraduate' | 'graduate' | 'doctoral';
}

// Proofreader analysis request interface
export interface ProofreaderAnalysisRequest {
  conversationId: string;
  documentContent: string;
  ideaDefinitions: IdeaDefinition[];
  analysisOptions?: AnalysisOptions;
}

// Analysis metadata for tracking analysis performance
export interface AnalysisMetadata {
  totalConcerns: number;
  concernsByCategory: Record<ConcernCategory, number>;
  concernsBySeverity: Record<ConcernSeverity, number>;
  analysisTime: number;
  contentLength: number;
  ideaDefinitionsUsed: number;
}

// Proofreader analysis response interface
export interface ProofreaderAnalysisResponse {
  success: boolean;
  concerns?: ProofreadingConcern[];
  analysisMetadata?: AnalysisMetadata;
  error?: string;
}

// Concern status update interface
export interface ConcernStatusUpdate {
  concernId: string;
  status: ConcernStatus;
  updatedBy?: string;
  notes?: string;
}

// Concern status breakdown for statistics
export interface ConcernStatusBreakdown {
  total: number;
  toBeDone: number;
  addressed: number;
  rejected: number;
}

// Concern statistics interface
export interface ConcernStatistics {
  total: number;
  toBeDone: number;
  addressed: number;
  rejected: number;
  byCategory: Record<ConcernCategory, ConcernStatusBreakdown>;
  bySeverity: Record<ConcernSeverity, ConcernStatusBreakdown>;
}

// Content analysis interfaces for detailed analysis
export interface StructureAnalysis {
  hasIntroduction: boolean;
  hasConclusion: boolean;
  sectionFlow: FlowAnalysis;
  headingHierarchy: HeadingAnalysis;
}

export interface FlowAnalysis {
  logicalProgression: boolean;
  transitionQuality: number; // 0-1 scale
  coherenceScore: number; // 0-1 scale
  flowIssues: string[];
}

export interface HeadingAnalysis {
  properHierarchy: boolean;
  consistentFormatting: boolean;
  descriptiveHeadings: boolean;
  hierarchyIssues: string[];
}

export interface StyleAnalysis {
  academicTone: number; // 0-1 scale
  formalityLevel: number; // 0-1 scale
  clarityScore: number; // 0-1 scale
  styleIssues: StyleIssue[];
}

export interface StyleIssue {
  type: 'tone' | 'formality' | 'clarity' | 'wordChoice' | 'sentence_structure';
  description: string;
  location?: ContentLocation;
  suggestion?: string;
}

export interface TerminologyIssue {
  term: string;
  inconsistentUsage: string[];
  suggestedStandardization: string;
  locations: ContentLocation[];
}

export interface CitationIssue {
  type: 'format' | 'missing' | 'incomplete' | 'style_inconsistency';
  description: string;
  location?: ContentLocation;
  suggestion?: string;
}

export interface FormattingIssue {
  type: 'spacing' | 'indentation' | 'font' | 'alignment' | 'numbering';
  description: string;
  location?: ContentLocation;
  suggestion?: string;
}

export interface ConsistencyAnalysis {
  terminologyConsistency: TerminologyIssue[];
  citationConsistency: CitationIssue[];
  formattingConsistency: FormattingIssue[];
}

export interface CompletenessAnalysis {
  missingSections: string[];
  insufficientDetail: string[];
  completenessScore: number; // 0-1 scale
}

// Main content analysis interface
export interface ContentAnalysis {
  structure: StructureAnalysis;
  style: StyleAnalysis;
  consistency: ConsistencyAnalysis;
  completeness: CompletenessAnalysis;
}