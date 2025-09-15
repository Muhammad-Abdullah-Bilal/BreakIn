import { useEffect, useState } from 'react';

export interface RecruiterDashboardData {
  metrics: {
    timeToHire: string;
    convRate: string;
    pipelineHealth: string;
  };
  matches: any[];
  pipeline: any[];
  openPositions: any[];
}

export function useRecruiterDashboard() {
  const [data, setData] = useState<RecruiterDashboardData>({
    metrics: { timeToHire: '12d', convRate: '4%', pipelineHealth: 'Good' },
    matches: [],
    pipeline: [],
    openPositions: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        // When API is available, uncomment this:
        // const response = await fetchDashboardData();
        
        // For now, use mock data
        const response = {
          metrics: { 
            timeToHire: '10d', 
            convRate: '5%', 
            pipelineHealth: 'Good' 
          },
          matches: [
            { id: 'm1', name: 'Candidate A', match: 95, skills: ['React', 'TypeScript'] },
            { id: 'm2', name: 'Candidate B', match: 90, skills: ['Node.js', 'MongoDB'] },
            { id: 'm3', name: 'Candidate C', match: 87, skills: ['Python', 'Django'] }
          ],
          pipeline: [
            { id: 'p1', name: 'Candidate D', stage: 'Interview', proofScore: 92 },
            { id: 'p2', name: 'Candidate E', stage: 'Technical', proofScore: 88 }
          ],
          openPositions: [
            { id: 'j1', title: 'Frontend Developer', candidates: 12 },
            { id: 'j2', title: 'Backend Developer', candidates: 8 },
            { id: 'j3', title: 'Full-Stack Developer', candidates: 5 }
          ]
        };
        
        if (isMounted) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return { 
    data, 
    isLoading, 
    error,
    // Spread data for convenience in components
    ...data
  };
}
