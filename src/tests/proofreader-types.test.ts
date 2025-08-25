/**
 * Unit tests for proofreader data types and interfaces
 * Tests type definitions, validations, and enum values
 */

import { describe, it, expect } from 'vitest';
import {
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  type ProofreadingConcern,
  type ContentLocation,
  type AnalysisOptions,
  type ProofreaderAnalysisRequest,
  type ProofreaderAnalysisResponse,
  type AnalysisMetadata,
  type ConcernStatusUpdate,
  type ConcernStatistics,
  type ConcernStatusBreakdown,
  type ContentAnalysis,
  type StructureAnalysis,
  type StyleAnalysis,
  type ConsistencyAnalysis,
  type CompletenessAnalysis,
  type StyleIssue,
  type TerminologyIssue,
  type CitationIssue,
  type FormattingIssue,
  type FlowAnalysis,
  type HeadingAnalysis,
  type IdeaDefinition
} from '../lib/ai-types';

describe('Proofreader Enums', () => {
  describe('ConcernCategory', () => {
    it('should have all required category values', () => {
      expect(ConcernCategory.CLARITY).toBe('clarity');
      expect(ConcernCategory.COHERENCE).toBe('coherence');
      expect(ConcernCategory.STRUCTURE).toBe('structure');
      expect(ConcernCategory.ACADEMIC_STYLE).toBe('academic_style');
      expect(ConcernCategory.CONSISTENCY).toBe('consistency');
      expect(ConcernCategory.COMPLETENESS).toBe('completeness');
      expect(ConcernCategory.CITATIONS).toBe('citations');
      expect(ConcernCategory.GRAMMAR).toBe('grammar');
      expect(ConcernCategory.TERMINOLOGY).toBe('terminology');
    });

    it('should have exactly 9 categories', () => {
      const categories = Object.values(ConcernCategory);
      expect(categories).toHaveLength(9);
    });
  });

  describe('ConcernSeverity', () => {
    it('should have all required severity levels', () => {
      expect(ConcernSeverity.LOW).toBe('low');
      expect(ConcernSeverity.MEDIUM).toBe('medium');
      expect(ConcernSeverity.HIGH).toBe('high');
      expect(ConcernSeverity.CRITICAL).toBe('critical');
    });

    it('should have exactly 4 severity levels', () => {
      const severities = Object.values(ConcernSeverity);
      expect(severities).toHaveLength(4);
    });
  });

  describe('ConcernStatus', () => {
    it('should have all required status values', () => {
      expect(ConcernStatus.TO_BE_DONE).toBe('to_be_done');
      expect(ConcernStatus.ADDRESSED).toBe('addressed');
      expect(ConcernStatus.REJECTED).toBe('rejected');
    });

    it('should have exactly 3 status values', () => {
      const statuses = Object.values(ConcernStatus);
      expect(statuses).toHaveLength(3);
    });
  });
});

describe('Proofreader Type Interfaces', () => {
  describe('ContentLocation', () => {
    it('should accept valid content location object', () => {
      const location: ContentLocation = {
        section: 'Introduction',
        paragraph: 2,
        startPosition: 100,
        endPosition: 150,
        context: 'This is the surrounding text context'
      };

      expect(location.section).toBe('Introduction');
      expect(location.paragraph).toBe(2);
      expect(location.startPosition).toBe(100);
      expect(location.endPosition).toBe(150);
      expect(location.context).toBe('This is the surrounding text context');
    });

    it('should accept partial content location object', () => {
      const location: ContentLocation = {
        section: 'Methodology'
      };

      expect(location.section).toBe('Methodology');
      expect(location.paragraph).toBeUndefined();
      expect(location.startPosition).toBeUndefined();
    });
  });

  describe('ProofreadingConcern', () => {
    it('should accept valid proofreading concern object', () => {
      const concern: ProofreadingConcern = {
        id: 'concern-123',
        conversationId: 'conv-456',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: 'Unclear sentence structure',
        description: 'The sentence structure in paragraph 2 is confusing',
        location: {
          section: 'Introduction',
          paragraph: 2,
          startPosition: 100,
          endPosition: 150
        },
        suggestions: ['Rewrite for clarity', 'Break into shorter sentences'],
        relatedIdeas: ['idea-1', 'idea-2'],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      expect(concern.id).toBe('concern-123');
      expect(concern.category).toBe(ConcernCategory.CLARITY);
      expect(concern.severity).toBe(ConcernSeverity.MEDIUM);
      expect(concern.status).toBe(ConcernStatus.TO_BE_DONE);
      expect(concern.suggestions).toHaveLength(2);
      expect(concern.relatedIdeas).toHaveLength(2);
    });

    it('should accept minimal proofreading concern object', () => {
      const concern: ProofreadingConcern = {
        id: 'concern-minimal',
        conversationId: 'conv-minimal',
        category: ConcernCategory.GRAMMAR,
        severity: ConcernSeverity.LOW,
        title: 'Minor grammar issue',
        description: 'Small grammatical error detected',
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(concern.id).toBe('concern-minimal');
      expect(concern.location).toBeUndefined();
      expect(concern.suggestions).toBeUndefined();
      expect(concern.relatedIdeas).toBeUndefined();
    });
  });

  describe('AnalysisOptions', () => {
    it('should accept valid analysis options', () => {
      const options: AnalysisOptions = {
        categories: [ConcernCategory.CLARITY, ConcernCategory.STRUCTURE],
        minSeverity: ConcernSeverity.MEDIUM,
        includeGrammar: true,
        academicLevel: 'graduate'
      };

      expect(options.categories).toHaveLength(2);
      expect(options.minSeverity).toBe(ConcernSeverity.MEDIUM);
      expect(options.includeGrammar).toBe(true);
      expect(options.academicLevel).toBe('graduate');
    });

    it('should accept empty analysis options', () => {
      const options: AnalysisOptions = {};
      
      expect(options.categories).toBeUndefined();
      expect(options.minSeverity).toBeUndefined();
      expect(options.includeGrammar).toBeUndefined();
      expect(options.academicLevel).toBeUndefined();
    });
  });

  describe('ProofreaderAnalysisRequest', () => {
    it('should accept valid analysis request', () => {
      const ideaDefinitions: IdeaDefinition[] = [
        { id: 1, title: 'Test Idea', description: 'Test description' }
      ];

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'conv-123',
        documentContent: 'This is the document content to analyze',
        ideaDefinitions,
        analysisOptions: {
          categories: [ConcernCategory.CLARITY],
          minSeverity: ConcernSeverity.LOW,
          includeGrammar: true,
          academicLevel: 'doctoral'
        }
      };

      expect(request.conversationId).toBe('conv-123');
      expect(request.documentContent).toBe('This is the document content to analyze');
      expect(request.ideaDefinitions).toHaveLength(1);
      expect(request.analysisOptions?.academicLevel).toBe('doctoral');
    });

    it('should accept request without analysis options', () => {
      const request: ProofreaderAnalysisRequest = {
        conversationId: 'conv-simple',
        documentContent: 'Simple content',
        ideaDefinitions: []
      };

      expect(request.analysisOptions).toBeUndefined();
      expect(request.ideaDefinitions).toHaveLength(0);
    });
  });

  describe('AnalysisMetadata', () => {
    it('should accept valid analysis metadata', () => {
      const metadata: AnalysisMetadata = {
        totalConcerns: 5,
        concernsByCategory: {
          [ConcernCategory.CLARITY]: 2,
          [ConcernCategory.STRUCTURE]: 1,
          [ConcernCategory.GRAMMAR]: 2,
          [ConcernCategory.COHERENCE]: 0,
          [ConcernCategory.ACADEMIC_STYLE]: 0,
          [ConcernCategory.CONSISTENCY]: 0,
          [ConcernCategory.COMPLETENESS]: 0,
          [ConcernCategory.CITATIONS]: 0,
          [ConcernCategory.TERMINOLOGY]: 0
        },
        concernsBySeverity: {
          [ConcernSeverity.LOW]: 3,
          [ConcernSeverity.MEDIUM]: 2,
          [ConcernSeverity.HIGH]: 0,
          [ConcernSeverity.CRITICAL]: 0
        },
        analysisTime: 1500,
        contentLength: 2000,
        ideaDefinitionsUsed: 3
      };

      expect(metadata.totalConcerns).toBe(5);
      expect(metadata.concernsByCategory[ConcernCategory.CLARITY]).toBe(2);
      expect(metadata.concernsBySeverity[ConcernSeverity.LOW]).toBe(3);
      expect(metadata.analysisTime).toBe(1500);
      expect(metadata.contentLength).toBe(2000);
      expect(metadata.ideaDefinitionsUsed).toBe(3);
    });
  });

  describe('ProofreaderAnalysisResponse', () => {
    it('should accept successful response with concerns', () => {
      const concerns: ProofreadingConcern[] = [
        {
          id: 'concern-1',
          conversationId: 'conv-1',
          category: ConcernCategory.CLARITY,
          severity: ConcernSeverity.MEDIUM,
          title: 'Test concern',
          description: 'Test description',
          status: ConcernStatus.TO_BE_DONE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const response: ProofreaderAnalysisResponse = {
        success: true,
        concerns,
        analysisMetadata: {
          totalConcerns: 1,
          concernsByCategory: {
            [ConcernCategory.CLARITY]: 1,
            [ConcernCategory.COHERENCE]: 0,
            [ConcernCategory.STRUCTURE]: 0,
            [ConcernCategory.ACADEMIC_STYLE]: 0,
            [ConcernCategory.CONSISTENCY]: 0,
            [ConcernCategory.COMPLETENESS]: 0,
            [ConcernCategory.CITATIONS]: 0,
            [ConcernCategory.GRAMMAR]: 0,
            [ConcernCategory.TERMINOLOGY]: 0
          },
          concernsBySeverity: {
            [ConcernSeverity.LOW]: 0,
            [ConcernSeverity.MEDIUM]: 1,
            [ConcernSeverity.HIGH]: 0,
            [ConcernSeverity.CRITICAL]: 0
          },
          analysisTime: 1000,
          contentLength: 500,
          ideaDefinitionsUsed: 0
        }
      };

      expect(response.success).toBe(true);
      expect(response.concerns).toHaveLength(1);
      expect(response.analysisMetadata?.totalConcerns).toBe(1);
      expect(response.error).toBeUndefined();
    });

    it('should accept error response', () => {
      const response: ProofreaderAnalysisResponse = {
        success: false,
        error: 'Analysis failed due to network error'
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Analysis failed due to network error');
      expect(response.concerns).toBeUndefined();
      expect(response.analysisMetadata).toBeUndefined();
    });
  });

  describe('ConcernStatusUpdate', () => {
    it('should accept valid status update', () => {
      const update: ConcernStatusUpdate = {
        concernId: 'concern-123',
        status: ConcernStatus.ADDRESSED,
        updatedBy: 'user-456',
        notes: 'Fixed the clarity issue by rewriting the sentence'
      };

      expect(update.concernId).toBe('concern-123');
      expect(update.status).toBe(ConcernStatus.ADDRESSED);
      expect(update.updatedBy).toBe('user-456');
      expect(update.notes).toBe('Fixed the clarity issue by rewriting the sentence');
    });

    it('should accept minimal status update', () => {
      const update: ConcernStatusUpdate = {
        concernId: 'concern-minimal',
        status: ConcernStatus.REJECTED
      };

      expect(update.concernId).toBe('concern-minimal');
      expect(update.status).toBe(ConcernStatus.REJECTED);
      expect(update.updatedBy).toBeUndefined();
      expect(update.notes).toBeUndefined();
    });
  });

  describe('ConcernStatistics', () => {
    it('should accept valid concern statistics', () => {
      const breakdown: ConcernStatusBreakdown = {
        total: 10,
        toBeDone: 5,
        addressed: 3,
        rejected: 2
      };

      const statistics: ConcernStatistics = {
        total: 10,
        toBeDone: 5,
        addressed: 3,
        rejected: 2,
        byCategory: {
          [ConcernCategory.CLARITY]: breakdown,
          [ConcernCategory.COHERENCE]: breakdown,
          [ConcernCategory.STRUCTURE]: breakdown,
          [ConcernCategory.ACADEMIC_STYLE]: breakdown,
          [ConcernCategory.CONSISTENCY]: breakdown,
          [ConcernCategory.COMPLETENESS]: breakdown,
          [ConcernCategory.CITATIONS]: breakdown,
          [ConcernCategory.GRAMMAR]: breakdown,
          [ConcernCategory.TERMINOLOGY]: breakdown
        },
        bySeverity: {
          [ConcernSeverity.LOW]: breakdown,
          [ConcernSeverity.MEDIUM]: breakdown,
          [ConcernSeverity.HIGH]: breakdown,
          [ConcernSeverity.CRITICAL]: breakdown
        }
      };

      expect(statistics.total).toBe(10);
      expect(statistics.toBeDone).toBe(5);
      expect(statistics.addressed).toBe(3);
      expect(statistics.rejected).toBe(2);
      expect(statistics.byCategory[ConcernCategory.CLARITY].total).toBe(10);
      expect(statistics.bySeverity[ConcernSeverity.LOW].total).toBe(10);
    });
  });
});

describe('Content Analysis Types', () => {
  describe('StyleIssue', () => {
    it('should accept valid style issue', () => {
      const issue: StyleIssue = {
        type: 'tone',
        description: 'The tone is too informal for academic writing',
        location: {
          section: 'Introduction',
          paragraph: 1
        },
        suggestion: 'Use more formal language and avoid contractions'
      };

      expect(issue.type).toBe('tone');
      expect(issue.description).toBe('The tone is too informal for academic writing');
      expect(issue.location?.section).toBe('Introduction');
      expect(issue.suggestion).toBe('Use more formal language and avoid contractions');
    });
  });

  describe('TerminologyIssue', () => {
    it('should accept valid terminology issue', () => {
      const issue: TerminologyIssue = {
        term: 'machine learning',
        inconsistentUsage: ['ML', 'machine learning', 'Machine Learning'],
        suggestedStandardization: 'machine learning',
        locations: [
          { section: 'Introduction', paragraph: 1 },
          { section: 'Methodology', paragraph: 3 }
        ]
      };

      expect(issue.term).toBe('machine learning');
      expect(issue.inconsistentUsage).toHaveLength(3);
      expect(issue.suggestedStandardization).toBe('machine learning');
      expect(issue.locations).toHaveLength(2);
    });
  });

  describe('ContentAnalysis', () => {
    it('should accept valid content analysis', () => {
      const analysis: ContentAnalysis = {
        structure: {
          hasIntroduction: true,
          hasConclusion: false,
          sectionFlow: {
            logicalProgression: true,
            transitionQuality: 0.8,
            coherenceScore: 0.7,
            flowIssues: ['Missing transition between sections 2 and 3']
          },
          headingHierarchy: {
            properHierarchy: true,
            consistentFormatting: false,
            descriptiveHeadings: true,
            hierarchyIssues: ['Inconsistent heading formatting in section 2']
          }
        },
        style: {
          academicTone: 0.8,
          formalityLevel: 0.7,
          clarityScore: 0.6,
          styleIssues: [
            {
              type: 'tone',
              description: 'Informal tone detected',
              suggestion: 'Use more formal language'
            }
          ]
        },
        consistency: {
          terminologyConsistency: [],
          citationConsistency: [],
          formattingConsistency: []
        },
        completeness: {
          missingSections: ['Conclusion'],
          insufficientDetail: ['Methodology'],
          completenessScore: 0.75
        }
      };

      expect(analysis.structure.hasIntroduction).toBe(true);
      expect(analysis.structure.hasConclusion).toBe(false);
      expect(analysis.style.academicTone).toBe(0.8);
      expect(analysis.completeness.missingSections).toContain('Conclusion');
      expect(analysis.completeness.completenessScore).toBe(0.75);
    });
  });
});

describe('Type Validation Helpers', () => {
  describe('Enum Value Validation', () => {
    it('should validate ConcernCategory values', () => {
      const validCategories = Object.values(ConcernCategory);
      const testCategory = 'clarity';
      
      expect(validCategories.includes(testCategory as ConcernCategory)).toBe(true);
      expect(validCategories.includes('invalid_category' as ConcernCategory)).toBe(false);
    });

    it('should validate ConcernSeverity values', () => {
      const validSeverities = Object.values(ConcernSeverity);
      const testSeverity = 'high';
      
      expect(validSeverities.includes(testSeverity as ConcernSeverity)).toBe(true);
      expect(validSeverities.includes('invalid_severity' as ConcernSeverity)).toBe(false);
    });

    it('should validate ConcernStatus values', () => {
      const validStatuses = Object.values(ConcernStatus);
      const testStatus = 'addressed';
      
      expect(validStatuses.includes(testStatus as ConcernStatus)).toBe(true);
      expect(validStatuses.includes('invalid_status' as ConcernStatus)).toBe(false);
    });
  });

  describe('Academic Level Validation', () => {
    it('should validate academic level values', () => {
      const validLevels = ['undergraduate', 'graduate', 'doctoral'];
      
      expect(validLevels.includes('graduate')).toBe(true);
      expect(validLevels.includes('invalid_level')).toBe(false);
    });
  });

  describe('Style Issue Type Validation', () => {
    it('should validate style issue types', () => {
      const validTypes = ['tone', 'formality', 'clarity', 'wordChoice', 'sentence_structure'];
      
      expect(validTypes.includes('tone')).toBe(true);
      expect(validTypes.includes('clarity')).toBe(true);
      expect(validTypes.includes('invalid_type')).toBe(false);
    });
  });
});