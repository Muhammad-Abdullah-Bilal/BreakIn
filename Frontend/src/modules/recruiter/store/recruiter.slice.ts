import { create } from 'zustand';

interface RecruiterState {
  // Search filters
  filters: {
    skills: string[];
    track: string | null;
    minProofScore: number;
    maxProofScore: number;
  };
  searchResults: any[];
  isLoading: boolean;
  error: Error | null;
  
  // Pipeline tracking
  pipeline: {
    stages: string[];
    candidates: {
      [stageId: string]: any[];
    };
  };
  
  // Selected candidates for bulk actions
  selectedCandidates: string[];
  
  // Actions
  setSkillsFilter: (skills: string[]) => void;
  setTrackFilter: (track: string | null) => void;
  setProofScoreRange: (min: number, max: number) => void;
  setSearchResults: (results: any[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  resetFilters: () => void;
  
  // Pipeline actions
  moveCandidateToStage: (candidateId: string, fromStage: string, toStage: string) => void;
  addPipelineStage: (stageName: string) => void;
  
  // Selection actions
  selectCandidate: (candidateId: string) => void;
  deselectCandidate: (candidateId: string) => void;
  clearSelection: () => void;
}

export const useRecruiterStore = create<RecruiterState>((set) => ({
  // Initial state
  filters: {
    skills: [],
    track: null,
    minProofScore: 0,
    maxProofScore: 100,
  },
  searchResults: [],
  isLoading: false,
  error: null,
  
  pipeline: {
    stages: ['Applied', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired'],
    candidates: {
      'Applied': [],
      'Screening': [],
      'Interview': [],
      'Technical': [],
      'Offer': [],
      'Hired': []
    }
  },
  
  selectedCandidates: [],
  
  // Filter actions
  setSkillsFilter: (skills) => set((state) => ({ 
    filters: { ...state.filters, skills } 
  })),
  
  setTrackFilter: (track) => set((state) => ({ 
    filters: { ...state.filters, track } 
  })),
  
  setProofScoreRange: (min, max) => set((state) => ({ 
    filters: { ...state.filters, minProofScore: min, maxProofScore: max } 
  })),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  resetFilters: () => set((state) => ({ 
    filters: {
      skills: [],
      track: null,
      minProofScore: 0,
      maxProofScore: 100,
    }
  })),
  
  // Pipeline actions
  moveCandidateToStage: (candidateId, fromStage, toStage) => set((state) => {
    const candidate = state.pipeline.candidates[fromStage]?.find(c => c.id === candidateId);
    if (!candidate) return state;
    
    return {
      pipeline: {
        ...state.pipeline,
        candidates: {
          ...state.pipeline.candidates,
          [fromStage]: state.pipeline.candidates[fromStage].filter(c => c.id !== candidateId),
          [toStage]: [...state.pipeline.candidates[toStage], candidate]
        }
      }
    };
  }),
  
  addPipelineStage: (stageName) => set((state) => ({
    pipeline: {
      ...state.pipeline,
      stages: [...state.pipeline.stages, stageName],
      candidates: {
        ...state.pipeline.candidates,
        [stageName]: []
      }
    }
  })),
  
  // Selection actions
  selectCandidate: (candidateId) => set((state) => ({
    selectedCandidates: [...state.selectedCandidates, candidateId]
  })),
  
  deselectCandidate: (candidateId) => set((state) => ({
    selectedCandidates: state.selectedCandidates.filter(id => id !== candidateId)
  })),
  
  clearSelection: () => set({ selectedCandidates: [] })
}));
