import { renderHook } from '@testing-library/react-hooks';
import { useRecruiterDashboard } from '../hooks/useRecruiterDashboard';
import * as api from '../services/recruiter.api';

// Mock the API module
jest.mock('../services/recruiter.api', () => ({
  fetchDashboardData: jest.fn()
}));

describe('useRecruiterDashboard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  test('returns loading state initially', () => {
    const { result } = renderHook(() => useRecruiterDashboard());
    expect(result.current.isLoading).toBe(true);
  });
  
  test('returns data when API call resolves', async () => {
    const mockData = {
      metrics: { timeToHire: '10d', convRate: '5%', pipelineHealth: 'Good' },
      matches: [{ id: 'm1', name: 'Candidate A' }],
      pipeline: [{ id: 'p1', name: 'Candidate B' }],
      openPositions: [{ id: 'j1', title: 'Developer' }]
    };
    
    (api.fetchDashboardData as jest.Mock).mockResolvedValue(mockData);
    
    const { result, waitForNextUpdate } = renderHook(() => useRecruiterDashboard());
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.metrics).toEqual(mockData.metrics);
    expect(result.current.matches).toEqual(mockData.matches);
    expect(result.current.pipeline).toEqual(mockData.pipeline);
    expect(result.current.openPositions).toEqual(mockData.openPositions);
  });
  
  test('returns error when API call fails', async () => {
    const mockError = new Error('API error');
    (api.fetchDashboardData as jest.Mock).mockRejectedValue(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => useRecruiterDashboard());
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});
