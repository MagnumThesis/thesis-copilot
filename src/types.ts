/**
 * Shared Types
 * Global type definitions for the thesis copilot application
 */

export * from './lib/ai-types';

// User roles
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin'
}

// User interface
export interface User {
  id: string;
  email?: string;
  role: UserRole;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  citationStyle: import('./lib/ai-types').CitationStyle;
  autoSave: boolean;
  notifications: boolean;
  language: string;
}

// Application state
export interface AppState {
  isLoading: boolean;
  error: string | null;
  user: User | null;
  currentChat: import('./lib/ai-types').Chat | null;
  chats: import('./lib/ai-types').Chat[];
}

// UI component props interfaces
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface FormProps<T = Record<string, unknown>> extends BaseComponentProps {
  onSubmit: (data: T) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

// API response interfaces
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database operation interfaces
export interface DatabaseOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'select';
  data?: Record<string, unknown>;
  where?: Record<string, unknown>;
  returning?: string[];
}

// Event system types
export type EventType =
  | 'chat_created'
  | 'chat_updated'
  | 'chat_deleted'
  | 'reference_added'
  | 'reference_updated'
  | 'reference_deleted'
  | 'citation_inserted'
  | 'ai_processing_started'
  | 'ai_processing_completed'
  | 'ai_error_occurred';

export interface AppEvent {
  type: EventType;
  payload: Record<string, unknown>;
  timestamp: string;
  source: string;
}

// Configuration interfaces
export interface AppConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  environment: 'development' | 'production' | 'test';
  features: {
    aiSearch: boolean;
    citations: boolean;
    bibliography: boolean;
    proofreader: boolean;
    collaboration: boolean;
  };
  limits: {
    maxFileSize: number;
    maxReferencesPerChat: number;
    maxChatsPerUser: number;
  };
}

// Error handling interfaces
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

// Notification system
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// File handling interfaces
export interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url?: string;
}

// Search interfaces
export interface SearchQuery {
  query: string;
  filters?: Record<string, string | number | boolean | string[]>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T = Record<string, unknown>> {
  items: T[];
  total: number;
  query: SearchQuery;
  facets?: Record<string, string | number>;
}

// Theme interfaces
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  isDark: boolean;
}

// Accessibility interfaces
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export interface AccessibilityContext {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
}

// Performance monitoring
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  period: {
    start: string;
    end: string;
  };
}

// Export all types for easy importing
export type {
  CitationStyle,
  ReferenceType,
  ModificationType,
  Reference,
  CitationInstance,
  Chat,
  AISearchResult
} from './lib/ai-types';
