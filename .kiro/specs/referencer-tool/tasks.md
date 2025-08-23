# Implementation Plan

- [x] 1. Set up database schema and core types

  - Create database migration v4 for referencer tables (references, citation_instances)
  - Add reference types and enums to ai-types.ts
  - Create database constraints and indexes for performance
  - _Requirements: 6.1, 6.2_

- [x] 2. Implement core reference data models and validation

- [x] 2.1 Create reference type definitions and interfaces

  - Define Reference, Author, ReferenceType, CitationStyle interfaces
  - Implement ReferenceFormData and ValidationError types
  - Create MetadataExtractionRequest/Response interfaces
  - _Requirements: 1.2, 6.1_

- [x] 2.2 Implement reference validation logic

  - Write validation functions for reference fields
  - Create style-specific validation rules
  - Implement DOI and URL format validation
  - Write unit tests for validation functions
  - _Requirements: 1.3, 5.1_

- [x] 3. Create metadata extraction engine

- [x] 3.1 Implement URL metadata extraction

  - Write HTML parser for Open Graph and Dublin Core metadata
  - Create URL validation and sanitization functions
  - Implement fallback extraction methods
  - Write unit tests for URL extraction
  - _Requirements: 2.1, 2.3_

- [x] 3.2 Implement DOI metadata extraction

  - Integrate with CrossRef API for DOI resolution
  - Create DOI format validation
  - Implement error handling for failed DOI lookups
  - Write unit tests for DOI extraction
  - _Requirements: 2.2, 2.3_

- [x] 3.3 Create metadata extraction engine coordinator

  - Implement MetadataExtractionEngine class
  - Coordinate between URL and DOI extraction
  - Handle extraction confidence scoring
  - Write integration tests for extraction engine
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement citation style engine

- [x] 4.1 Create basic citation formatting functions

  - Implement APA style inline citation formatting
  - Implement APA style bibliography entry formatting
  - Create author name formatting utilities
  - Write unit tests for APA formatting
  - _Requirements: 1.3, 3.3_

- [x] 4.2 Extend citation styles support

  - Implement MLA, Chicago, and Harvard citation styles
  - Create style-specific formatting rules
  - Implement date and page formatting utilities
  - Write unit tests for all citation styles
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4.3 Create bibliography generation functionality

  - Implement bibliography sorting (alphabetical, chronological)
  - Create bibliography formatting for all styles
  - Handle duplicate reference detection
  - Write unit tests for bibliography generation
  - _Requirements: 3.3, 6.6_

- [x] 5. Create reference management backend

- [x] 5.1 Implement reference database operations

  - Create reference CRUD operations in Supabase
  - Implement conversation-scoped reference queries
  - Create reference search and filtering functions
  - Write unit tests for database operations
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 5.2 Create reference management engine

  - Implement ReferenceManagementEngine class
  - Coordinate reference operations with validation
  - Handle reference creation with metadata extraction
  - Write integration tests for reference management
  - _Requirements: 1.1, 1.2, 6.1, 6.4_

- [x] 5.3 Implement referencer API handler

  - Create POST /api/referencer/references endpoint
  - Create GET /api/referencer/references/:conversationId endpoint
  - Create PUT /api/referencer/references/:referenceId endpoint
  - Create DELETE /api/referencer/references/:referenceId endpoint
  - Create POST /api/referencer/extract-metadata endpoint
  - Write API integration tests
  - _Requirements: 1.1, 1.2, 6.1, 6.3, 6.4_

- [-] 6. Create frontend reference management components



- [x] 6.1 Implement reference form component

  - Create ReferenceForm component with all reference fields
  - Implement URL/DOI import functionality
  - Add real-time validation and error display
  - Create manual entry mode with field validation

  - Write component unit tests
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 6.2 Create reference list component

  - Implement ReferenceList component with search and filtering
  - Add reference type filtering dropdown
  - Create reference item display with edit/delete actions
  - Implement virtual scrolling for large lists
  - Write component unit tests
  - _Requirements: 6.2, 6.5_

- [x] 6.3 Implement reference detail component

  - Create ReferenceDetail component for viewing/editing
  - Add citation preview for different styles
  - Implement reference deletion with confirmation
  - Create reference tagging functionality
  - Write component unit tests
  - _Requirements: 6.4, 6.5_

- [x] 7. Create citation and bibliography components
- [x] 7.1 Implement citation formatter component

  - Create CitationFormatter component with style selection
  - Add inline citation and bibliography entry preview
  - Implement citation insertion into document
  - Create citation style switching functionality
  - Write component unit tests
  - _Requirements: 1.3, 3.1, 3.2, 3.3_

- [x] 7.2 Create bibliography generator component

  - [x] Implement export formatters utility with 5 formats (BibTeX, RIS, EndNote, Zotero, Plain Text)
  - [x] Create useBibliographyGenerator hook with core logic and statistics
  - [x] Implement BibliographyControls component with style selection and sorting
  - [x] Create ExportOptions component with format selection and download
  - Implement main BibliographyGenerator component integration
  - Add bibliography insertion functionality
  - Create BibliographyPreview component with statistics
  - Write component unit tests
  - _Requirements: 3.3, 6.6_

- [x] 8. Create main referencer tool interface
- [x] 8.1 Implement referencer tool component

  - ✅ Create main Referencer component with tabbed interface
  - ✅ Integrate reference list, form, and citation components
  - ✅ Add citation style selection and persistence
  - ✅ Implement search and filtering state management
  - ✅ Write component integration tests
  - _Requirements: 1.1, 6.2, 6.5_

- [x] 8.2 Add referencer tool to application ✅

  - ✅ Integrate Referencer component into main application (ToolsPanel)
  - ✅ Add referencer tool button to UI toolbar
  - ✅ Implement conversation context integration
  - ✅ Create tabbed interface with references, citations, bibliography
  - ✅ Implement search, filtering, and citation style selection
  - ✅ Build process completed successfully with no TypeScript errors
  - _Requirements: 1.1, 4.1, 6.1_

- [x] 9. Implement citation insertion integration
- [x] 9.1 Create citation insertion functionality ✅

  - ✅ Implement text selection detection for citation insertion
  - ✅ Create citation insertion into Builder tool content
  - ✅ Add citation tracking in document
  - ✅ Implement citation update when references change
  - ✅ Write integration tests for citation insertion
  - _Requirements: 1.1, 1.4, 4.2, 6.4_

- [x] 9.2 Add bibliography insertion to Builder tool ✅

  - ✅ Create bibliography insertion at cursor position
  - ✅ Implement automatic bibliography updates
  - ✅ Add bibliography formatting preservation
  - ✅ Create bibliography regeneration on style changes
  - ✅ Write integration tests for bibliography insertion
  - _Requirements: 1.4, 3.3, 4.1_

- [x] 10. Implement advanced features and polish
- [x] 10.1 Add reference validation and checking ✅

  - ✅ Implement reference completeness validation
  - ✅ Create broken URL and invalid DOI detection
  - ✅ Add orphaned citation detection and warnings
  - ✅ Implement reference quality scoring
  - ✅ Write unit tests for validation features
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10.2 Create export and sharing functionality ✅

  - ✅ Implement bibliography export in multiple formats
  - ✅ Add reference sharing between conversations
  - ✅ Create reference import from external files
  - ✅ Implement reference backup and restore
  - ✅ Write integration tests for export/import features
  - _Requirements: 4.1, 4.2, 6.6_

- [x] 11. Add error handling and performance optimization
- [x] 11.1 Implement comprehensive error handling ✅

  - ✅ Add error boundaries for referencer components
  - ✅ Implement retry logic for metadata extraction
  - ✅ Create graceful degradation for offline mode
  - ✅ Add user-friendly error messages and recovery
  - ✅ Write error handling tests
  - _Requirements: 2.3, 5.2_

- [x] 11.2 Optimize performance and user experience ✅

  - ✅ Implement caching for formatted citations
  - ✅ Add debounced search and filtering
  - ✅ Create loading states and progress indicators
  - ✅ Optimize database queries and API calls
  - ✅ Write performance tests and benchmarks
  - _Requirements: 6.5, 3.1, 3.2_

- [-] 12. AI-Powered Reference Searcher



- [ ] 12.1 Create content extraction engine

  - Implement content extractor for Ideas tool data
  - Implement content extractor for Builder tool content
  - Create text preprocessing and keyword extraction
  - Handle different content formats and structures
  - Write unit tests for content extraction
  - _Requirements: 7.1, 7.2_


- [ ] 12.2 Implement Google Scholar search integration

  - Create Google Scholar search API client
  - Implement search query generation from extracted content
  - Add rate limiting and request throttling
  - Handle search result parsing and filtering
  - Write unit tests for search integration

  - _Requirements: 7.3, 7.4_

- [ ] 12.3 Build reference suggestion engine

  - Create reference suggestion scoring algorithm
  - Implement relevance ranking based on content similarity
  - Add duplicate detection for existing references
  - Create confidence scoring for suggestions

  - Write unit tests for suggestion engine
  - _Requirements: 7.5, 7.6_

- [ ] 12.4 Create AI Searcher frontend component

  - Implement AI Searcher tab in referencer tool
  - Create content selection interface (Ideas/Builder)
  - Add search progress indicators and results display


  - Implement reference suggestion acceptance/rejection
  - Write component unit tests
  - _Requirements: 7.1, 7.2, 7.7_

- [x] 12.5 Add search history and analytics

  - Implement search query history storage
  - Create search analytics and usage tracking
  - Add search result caching for performance
  - Implement privacy controls for search data
  - Write integration tests for search features
  - _Requirements: 7.8, 7.9_

- [ ] 13. Complete Google Scholar Integration

- [ ] 13.1 Implement Google Scholar search client

  - Create GoogleScholarClient class for web scraping
  - Implement search query generation and execution
  - Add rate limiting and request throttling
  - Handle search result parsing and error handling
  - Write unit tests for search client
  - _Requirements: 7.3, 7.4_

- [ ] 13.2 Integrate content extraction with AI searcher

  - Connect content extraction engine to AI searcher component
  - Implement content source selection (Ideas/Builder)
  - Add automatic search query generation from extracted content
  - Create content preview and selection interface
  - Write integration tests for content-to-search flow
  - _Requirements: 7.1, 7.2_

- [ ] 13.3 Complete AI searcher backend integration

  - Connect AI searcher API to Google Scholar client
  - Implement real search functionality (replace mock data)
  - Add search result ranking and relevance scoring
  - Integrate with reference suggestion engine
  - Write end-to-end tests for AI search functionality
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 13.4 Add advanced search features

  - Implement search filters (date range, author, journal)
  - Add search result export functionality
  - Create search result comparison and deduplication
  - Implement search result bookmarking
  - Write tests for advanced search features
  - _Requirements: 7.6, 7.7_

- [ ] 13.5 Implement feedback and learning system

  - Add user feedback collection for search results
  - Implement learning from accepted/rejected suggestions
  - Create search quality metrics and monitoring
  - Add search result confidence scoring improvements
  - Write tests for feedback system
  - _Requirements: 7.8_

- [ ] 14. Fix AI Searcher Integration Issues

- [ ] 14.1 Fix AI searcher tab navigation

  - Add 'ai-searcher' tab to the tab navigation array in referencer.tsx
  - Implement AI searcher case in renderTabContent() method
  - Add proper AI searcher tab icon (Sparkles) in getTabIcon() method
  - Test AI searcher tab switching functionality
  - _Requirements: 7.1_

- [ ] 14.2 Complete AI searcher component integration

  - Connect AISearcher component to reference management
  - Implement onAddReference callback to add suggestions to reference library
  - Add proper error handling for failed searches
  - Integrate with content extraction for Ideas and Builder sources
  - Test end-to-end AI search to reference addition flow
  - _Requirements: 7.7_

- [ ] 14.3 Implement real Google Scholar search

  - Replace mock search results with actual Google Scholar API calls
  - Implement proper metadata extraction from search results
  - Add search result validation and quality scoring
  - Handle rate limiting and search quotas
  - Test with various search queries and edge cases
  - _Requirements: 7.3, 7.4_

- [ ] 14.4 Add content source selection interface

  - Create content source selection UI (Ideas vs Builder)
  - Implement content preview before search
  - Add content filtering and keyword extraction options
  - Create search query customization interface
  - Test content extraction and search query generation
  - _Requirements: 7.1, 7.2_
