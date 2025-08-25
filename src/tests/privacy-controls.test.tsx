import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacyControls } from '../components/ui/privacy-controls';

// Mock the usePrivacyManager hook
const mockPrivacyManager = {
  settings: {
    userId: 'test-user',
    dataRetentionDays: 365,
    autoDeleteEnabled: false,
    analyticsEnabled: true,
    learningEnabled: true,
    exportFormat: 'json' as const,
    consentGiven: true,
    consentDate: new Date('2024-01-01'),
    lastUpdated: new Date()
  },
  dataSummary: {
    searchSessions: 10,
    searchResults: 25,
    feedbackEntries: 5,
    learningData: 15,
    totalSize: '125 KB',
    oldestEntry: new Date('2024-01-01'),
    newestEntry: new Date('2024-01-05')
  },
  isLoading: false,
  error: null,
  loadSettings: vi.fn(),
  updateSettings: vi.fn(),
  loadDataSummary: vi.fn(),
  clearAllData: vi.fn(),
  clearOldData: vi.fn(),
  exportData: vi.fn(),
  checkConsentStatus: vi.fn(),
  anonymizeData: vi.fn(),
  hasConsent: true,
  canUseAnalytics: true,
  canUseLearning: true
};

vi.mock('../../hooks/usePrivacyManager', () => ({
  usePrivacyManager: () => mockPrivacyManager
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('PrivacyControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrivacyManager.updateSettings.mockResolvedValue(undefined);
    mockPrivacyManager.clearAllData.mockResolvedValue({ deletedCount: 10 });
    mockPrivacyManager.clearOldData.mockResolvedValue({ deletedCount: 5 });
    mockPrivacyManager.exportData.mockResolvedValue({ 
      exportData: '{"test": "data"}', 
      recordCount: 10 
    });
  });

  it('should render privacy controls with current settings', () => {
    render(<PrivacyControls />);

    expect(screen.getByText('Privacy & Data Management')).toBeInTheDocument();
    expect(screen.getByText('Data Processing Consent')).toBeInTheDocument();
    expect(screen.getByText('Data Retention Settings')).toBeInTheDocument();
    expect(screen.getByText('Feature Controls')).toBeInTheDocument();
    expect(screen.getByText('Your Data Summary')).toBeInTheDocument();
  });

  it('should display consent status correctly', () => {
    render(<PrivacyControls />);

    expect(screen.getByText(/Consent granted on/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('365')).toBeInTheDocument(); // retention days
  });

  it('should handle consent toggle', async () => {
    render(<PrivacyControls />);

    const consentSwitch = screen.getByRole('switch', { name: /Allow AI search data collection/ });
    fireEvent.click(consentSwitch);

    await waitFor(() => {
      expect(mockPrivacyManager.updateSettings).toHaveBeenCalledWith({
        consentGiven: false,
        consentDate: undefined,
        analyticsEnabled: false,
        learningEnabled: false
      });
    });
  });

  it('should handle data retention period change', async () => {
    render(<PrivacyControls />);

    const retentionSelect = screen.getByDisplayValue('365');
    fireEvent.change(retentionSelect, { target: { value: '90' } });

    await waitFor(() => {
      expect(mockPrivacyManager.updateSettings).toHaveBeenCalledWith({
        dataRetentionDays: 90
      });
    });
  });

  it('should handle auto-delete toggle', async () => {
    render(<PrivacyControls />);

    const autoDeleteSwitch = screen.getByRole('switch', { name: /Automatic cleanup/ });
    fireEvent.click(autoDeleteSwitch);

    await waitFor(() => {
      expect(mockPrivacyManager.updateSettings).toHaveBeenCalledWith({
        autoDeleteEnabled: true
      });
    });
  });

  it('should display data summary correctly', () => {
    render(<PrivacyControls />);

    expect(screen.getByText('10')).toBeInTheDocument(); // search sessions
    expect(screen.getByText('25')).toBeInTheDocument(); // search results
    expect(screen.getByText('5')).toBeInTheDocument(); // feedback entries
    expect(screen.getByText('15')).toBeInTheDocument(); // learning data
    expect(screen.getByText('125 KB')).toBeInTheDocument(); // total size
  });

  it('should handle data export', async () => {
    // Mock URL.createObjectURL and related DOM methods
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(<PrivacyControls />);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockPrivacyManager.exportData).toHaveBeenCalledWith('json');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Data Exported",
        description: "Successfully exported 10 records."
      });
    });
  });

  it('should handle clear old data', async () => {
    render(<PrivacyControls />);

    const clearOldButton = screen.getByText('Clear Old Data');
    fireEvent.click(clearOldButton);

    await waitFor(() => {
      expect(mockPrivacyManager.clearOldData).toHaveBeenCalledWith(365);
      expect(mockToast).toHaveBeenCalledWith({
        title: "Old Data Cleared",
        description: "Successfully cleared 5 old records."
      });
    });
  });

  it('should handle clear all data with confirmation', async () => {
    render(<PrivacyControls />);

    const clearAllButton = screen.getByText('Clear All Data');
    fireEvent.click(clearAllButton);

    // Should show confirmation dialog
    expect(screen.getByText(/This action will permanently delete/)).toBeInTheDocument();

    const confirmButton = screen.getByText('Delete All Data');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockPrivacyManager.clearAllData).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Data Cleared",
        description: "Successfully cleared 10 records."
      });
    });
  });

  it('should disable features when consent is not given', () => {
    mockPrivacyManager.settings!.consentGiven = false;
    mockPrivacyManager.hasConsent = false;
    mockPrivacyManager.canUseAnalytics = false;
    mockPrivacyManager.canUseLearning = false;

    render(<PrivacyControls />);

    const analyticsSwitch = screen.getByRole('switch', { name: /Analytics tracking/ });
    const learningSwitch = screen.getByRole('switch', { name: /AI learning system/ });
    const autoDeleteSwitch = screen.getByRole('switch', { name: /Automatic cleanup/ });

    expect(analyticsSwitch).toBeDisabled();
    expect(learningSwitch).toBeDisabled();
    expect(autoDeleteSwitch).toBeDisabled();
  });

  it('should show warning when consent is not given', () => {
    mockPrivacyManager.settings!.consentGiven = false;
    mockPrivacyManager.hasConsent = false;

    render(<PrivacyControls />);

    expect(screen.getByText(/Analytics and learning features are disabled without consent/)).toBeInTheDocument();
  });

  it('should handle export format change', async () => {
    render(<PrivacyControls />);

    const formatSelect = screen.getByDisplayValue('JSON');
    fireEvent.change(formatSelect, { target: { value: 'csv' } });

    await waitFor(() => {
      expect(mockPrivacyManager.updateSettings).toHaveBeenCalledWith({
        exportFormat: 'csv'
      });
    });
  });

  it('should show loading states correctly', () => {
    mockPrivacyManager.isLoading = true;

    render(<PrivacyControls />);

    // Switches should be disabled during loading
    const switches = screen.getAllByRole('switch');
    switches.forEach(switchElement => {
      expect(switchElement).toBeDisabled();
    });
  });

  it('should handle errors gracefully', async () => {
    mockPrivacyManager.updateSettings.mockRejectedValue(new Error('Update failed'));

    render(<PrivacyControls />);

    const consentSwitch = screen.getByRole('switch', { name: /Allow AI search data collection/ });
    fireEvent.click(consentSwitch);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      });
    });
  });
});