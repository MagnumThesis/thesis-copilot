import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchAnalyticsDashboard } from '../components/ui/search-analytics-dashboard';

// Mock fetch globally
global.fetch = vi.fn();

const mockStats = {
  totalSearches: 25,
  successfulSearches: 20,
  averageResultsPerSearch: 7.5,
  averageSuccessRate: 0.8,
  averageProcessingTime: 2200,
  mostUsedContentSources: [
    { source: 'ideas' as const, count: 15, percentage: 60 },
    { source: 'builder' as const, count: 10, percentage: 40 }
  ],
  topSearchQueries: [
    {
      query: 'machine learning research',
      count: 5,
      averageResults: 8.2,
      successRate: 0.85
    },
    {
      query: 'deep learning applications',
      count: 3,
      averageResults: 6.5,
      successRate: 0.75
    }
  ],
  searchTrends: [
    {
      date: '2024-01-15',
      searchCount: 8,
      successRate: 0.85,
      averageResults: 7.8
    },
    {
      date: '2024-01-14',
      searchCount: 6,
      successRate: 0.75,
      averageResults: 6.5
    }
  ]
};

const mockContentUsage = [
  {
    source: 'ideas' as const,
    totalUsage: 15,
    successfulSearches: 12,
    averageResults: 7.8,
    topKeywords: ['research', 'analysis', 'methodology'],
    recentUsage: [
      { date: '2024-01-15', count: 5 },
      { date: '2024-01-14', count: 3 }
    ]
  },
  {
    source: 'builder' as const,
    totalUsage: 10,
    successfulSearches: 8,
    averageResults: 6.2,
    topKeywords: ['structure', 'framework', 'implementation'],
    recentUsage: [
      { date: '2024-01-15', count: 3 },
      { date: '2024-01-14', count: 2 }
    ]
  }
];

const mockSuccessTracking = [
  {
    date: '2024-01-15',
    totalSearches: 8,
    successfulSearches: 7,
    successRate: 0.875,
    averageResults: 7.8
  },
  {
    date: '2024-01-14',
    totalSearches: 6,
    successfulSearches: 4,
    successRate: 0.667,
    averageResults: 6.5
  }
];

describe('SearchAnalyticsDashboard', () => {
  const defaultProps = {
    conversationId: 'conv-1',
    userId: 'user-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/history/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            stats: mockStats
          })
        });
      }
      
      if (url.includes('/history/content-usage')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            usage: mockContentUsage
          })
        });
      }
      
      if (url.includes('/analytics/success-tracking')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            tracking: mockSuccessTracking
          })
        });
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering and initialization', () => {
    it('should render dashboard with loading state initially', () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should render dashboard header and controls', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Comprehensive analytics for your AI search activity')).toBeInTheDocument();
      });
      
      // Check period selection buttons
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('30 days')).toBeInTheDocument();
      expect(screen.getByText('90 days')).toBeInTheDocument();
      
      // Check refresh button
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should display overview cards with correct data', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // Total searches
        expect(screen.getByText('20 successful')).toBeInTheDocument();
        expect(screen.getByText('80.0%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('7.5')).toBeInTheDocument(); // Average results
        expect(screen.getByText('2.2s')).toBeInTheDocument(); // Processing time
      });
    });
  });

  describe('period selection', () => {
    it('should change period when clicking period buttons', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Analytics Dashboard')).toBeInTheDocument();
      });
      
      const sevenDaysButton = screen.getByText('7 days');
      fireEvent.click(sevenDaysButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('days=7')
        );
      });
    });

    it('should highlight selected period', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const thirtyDaysButton = screen.getByText('30 days');
        expect(thirtyDaysButton.closest('button')).toHaveClass('bg-primary'); // Default selected
      });
    });
  });

  describe('tabs and content', () => {
    it('should render all tab options', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Trends')).toBeInTheDocument();
        expect(screen.getByText('Content Sources')).toBeInTheDocument();
        expect(screen.getByText('Top Queries')).toBeInTheDocument();
        expect(screen.getByText('Success Tracking')).toBeInTheDocument();
      });
    });

    it('should display trends data correctly', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Trends')).toBeInTheDocument();
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('8 searches')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument();
      });
    });

    it('should switch between tabs correctly', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Trends')).toBeInTheDocument();
      });
      
      // Click on Content Sources tab
      const sourcesTab = screen.getByText('Content Sources');
      fireEvent.click(sourcesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Content Source Usage')).toBeInTheDocument();
        expect(screen.getByText('Source Effectiveness')).toBeInTheDocument();
      });
    });

    it('should display content source usage data', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      // Switch to Content Sources tab
      const sourcesTab = screen.getByText('Content Sources');
      fireEvent.click(sourcesTab);
      
      await waitFor(() => {
        expect(screen.getByText('ideas')).toBeInTheDocument();
        expect(screen.getByText('builder')).toBeInTheDocument();
        expect(screen.getByText('15 uses')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();
      });
    });

    it('should display top queries data', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      // Switch to Top Queries tab
      const queriesTab = screen.getByText('Top Queries');
      fireEvent.click(queriesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Top Search Queries')).toBeInTheDocument();
        expect(screen.getByText('"machine learning research"')).toBeInTheDocument();
        expect(screen.getByText('Used 5 times')).toBeInTheDocument();
        expect(screen.getByText('8.2')).toBeInTheDocument(); // Average results
      });
    });

    it('should display success tracking data', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      // Switch to Success Tracking tab
      const successTab = screen.getByText('Success Tracking');
      fireEvent.click(successTab);
      
      await waitFor(() => {
        expect(screen.getByText('Success Rate Tracking')).toBeInTheDocument();
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('8 searches')).toBeInTheDocument();
        expect(screen.getByText('87.5%')).toBeInTheDocument(); // Success rate
      });
    });
  });

  describe('refresh functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Analytics Dashboard')).toBeInTheDocument();
      });
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
      
      // Should show refreshing state
      expect(refreshButton).toBeDisabled();
      
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });
    });
  });

  describe('error handling', () => {
    it('should display error message when API fails', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: false,
            error: 'Database connection failed'
          })
        })
      );
      
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockImplementation(() => 
        Promise.reject(new Error('Network error'))
      );
      
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display empty state when no data is available', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/history/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              stats: {
                ...mockStats,
                totalSearches: 0,
                searchTrends: []
              }
            })
          });
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            usage: [],
            tracking: []
          })
        });
      });
      
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No trend data available')).toBeInTheDocument();
      });
    });
  });

  describe('data formatting', () => {
    it('should format percentages correctly', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Success rate should be formatted as percentage
        expect(screen.getByText('80.0%')).toBeInTheDocument();
      });
    });

    it('should format processing time correctly', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        // Processing time should be formatted as seconds
        expect(screen.getByText('2.2s')).toBeInTheDocument();
      });
    });

    it('should apply correct color coding for success rates', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const successRateElement = screen.getByText('80.0%');
        expect(successRateElement).toHaveClass('text-green-600'); // High success rate
      });
    });
  });

  describe('responsive design', () => {
    it('should render grid layouts for different screen sizes', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const overviewGrid = screen.getByText('25').closest('.grid');
        expect(overviewGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
        
        const tabList = screen.getByRole('tablist');
        expect(tabList).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const firstTab = screen.getByRole('tab', { name: 'Trends' });
        expect(firstTab).toBeInTheDocument();
        
        // Tab should be focusable
        firstTab.focus();
        expect(document.activeElement).toBe(firstTab);
      });
    });
  });

  describe('integration with analytics hooks', () => {
    it('should call analytics APIs with correct parameters', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`conversationId=${defaultProps.conversationId}`)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('days=30')
        );
      });
    });

    it('should handle different time periods correctly', async () => {
      render(<SearchAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Search Analytics Dashboard')).toBeInTheDocument();
      });
      
      // Test 7 days
      fireEvent.click(screen.getByText('7 days'));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('days=7')
        );
      });
      
      // Test 90 days
      fireEvent.click(screen.getByText('90 days'));
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('days=90')
        );
      });
    });
  });
});