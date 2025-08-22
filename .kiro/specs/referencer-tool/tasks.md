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

- [ ] 6.2 Create reference list component






  - Implement ReferenceList component with search and filtering
  - Add reference type filtering dropdown
  - Create reference item display with edit/delete actions
  - Implement virtual scrolling for large lists
  - Write component unit tests
  - _Requirements: 6.2, 6.5_

- [ ] 6.3 Implement reference detail component

  - Create ReferenceDetail component for viewing/editing
  - Add citation preview for different styles
  - Implement reference deletion with confirmation
  - Create reference tagging functionality
  - Write component unit tests
  - _Requirements: 6.4, 6.5_

- [ ] 7. Create citation and bibliography components
- [ ] 7.1 Implement citation formatter component

  - Create CitationFormatter component with style selection
  - Add inline citation and bibliography entry preview
  - Implement citation insertion into document
  - Create citation style switching functionality
  - Write component unit tests
  - _Requirements: 1.3, 3.1, 3.2, 3.3_

- [ ] 7.2 Create bibliography generator component

  - Implement BibliographyGenerator component
  - Add bibliography sorting options
  - Create bibliography insertion functionality
  - Implement export to different formats (BibTeX, RIS)
  - Write component unit tests
  - _Requirements: 3.3, 6.6_

- [ ] 8. Create main referencer tool interface
- [ ] 8.1 Implement referencer tool component

  - Create main Referencer component with tabbed interface
  - Integrate reference list, form, and citation components
  - Add citation style selection and persistence
  - Implement search and filtering state management
  - Write component integration tests
  - _Requirements: 1.1, 6.2, 6.5_

- [ ] 8.2 Add referencer tool to application

  - Integrate Referencer component into main application
  - Add referencer tool button to UI toolbar
  - Implement conversation context integration
  - Create keyboard shortcuts for common actions
  - Write end-to-end tests for referencer workflow
  - _Requirements: 1.1, 4.1, 6.1_

- [ ] 9. Implement citation insertion integration
- [ ] 9.1 Create citation insertion functionality

  - Implement text selection detection for citation insertion
  - Create citation insertion into Builder tool content
  - Add citation tracking in document
  - Implement citation update when references change
  - Write integration tests for citation insertion
  - _Requirements: 1.1, 1.4, 4.2, 6.4_

- [ ] 9.2 Add bibliography insertion to Builder tool

  - Create bibliography insertion at cursor position
  - Implement automatic bibliography updates
  - Add bibliography formatting preservation
  - Create bibliography regeneration on style changes
  - Write integration tests for bibliography insertion
  - _Requirements: 1.4, 3.3, 4.1_

- [ ] 10. Implement advanced features and polish
- [ ] 10.1 Add reference validation and checking

  - Implement reference completeness validation
  - Create broken URL and invalid DOI detection
  - Add orphaned citation detection and warnings
  - Implement reference quality scoring
  - Write unit tests for validation features
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10.2 Create export and sharing functionality

  - Implement bibliography export in multiple formats
  - Add reference sharing between conversations
  - Create reference import from external files
  - Implement reference backup and restore
  - Write integration tests for export/import features
  - _Requirements: 4.1, 4.2, 6.6_

- [ ] 11. Add error handling and performance optimization
- [ ] 11.1 Implement comprehensive error handling

  - Add error boundaries for referencer components
  - Implement retry logic for metadata extraction
  - Create graceful degradation for offline mode
  - Add user-friendly error messages and recovery
  - Write error handling tests
  - _Requirements: 2.3, 5.2_

- [ ] 11.2 Optimize performance and user experience
  - Implement caching for formatted citations
  - Add debounced search and filtering
  - Create loading states and progress indicators
  - Optimize database queries and API calls
  - Write performance tests and benchmarks
  - _Requirements: 6.5, 3.1, 3.2_
