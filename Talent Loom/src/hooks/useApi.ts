// Enhanced hooks for API calls with React Query and Coral MCP integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi, jobsApi, pipelineApi, offersApi, matchesApi, dashboardApi, reportsApi, billingApi, payoutsApi } from '@/lib/api';
import { CandidateFilters, PipelineStage } from '@/types';
import { toast } from 'sonner';

// Enhanced Query Keys
export const queryKeys = {
  candidates: ['candidates'] as const,
  candidateSearch: (query: string) => ['candidates', 'search', query] as const,
  candidateDiscover: (jobId: string) => ['candidates', 'discover', jobId] as const,
  candidateById: (id: string) => ['candidates', id] as const,
  jobs: ['jobs'] as const,
  jobById: (id: string) => ['jobs', id] as const,
  pipeline: ['pipeline'] as const,
  pipelineSuggestion: (itemId: string) => ['pipeline', 'suggestion', itemId] as const,
  offers: ['offers'] as const,
  offerSummary: (offerId: string) => ['offers', 'summary', offerId] as const,
  matches: ['matches'] as const,
  matchesForJob: (jobId: string) => ['matches', 'job', jobId] as const,
  matchExplanation: (candidateId: string, jobId: string) => ['matches', 'explanation', candidateId, jobId] as const,
  dashboard: ['dashboard'] as const,
  dashboardNarrative: ['dashboard', 'narrative'] as const,
  billing: ['billing'] as const,
  payouts: ['payouts'] as const,
  reports: ['reports'] as const,
  exportStatus: (jobId: string) => ['reports', 'export', jobId] as const,
};

// Candidates Hooks
export const useCandidates = (filters?: Partial<CandidateFilters>) => {
  return useQuery({
    queryKey: [...queryKeys.candidates, filters],
    queryFn: () => candidatesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCandidate = (id: string) => {
  return useQuery({
    queryKey: queryKeys.candidateById(id),
    queryFn: () => candidatesApi.getById(id),
    enabled: !!id,
  });
};

export const useCandidateSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.candidateSearch(query),
    queryFn: () => candidatesApi.search(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// New: Semantic candidate discovery
export const useCandidateDiscovery = (jobId: string, filters?: Partial<CandidateFilters>) => {
  return useQuery({
    queryKey: [...queryKeys.candidateDiscover(jobId), filters],
    queryFn: () => candidatesApi.discover(jobId, filters),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000,
  });
};

// Jobs Hooks
export const useJobs = () => {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: jobsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJob = (id: string) => {
  return useQuery({
    queryKey: queryKeys.jobById(id),
    queryFn: () => jobsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      toast.success('Job posting created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create job posting');
      console.error('Create job error:', error);
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      jobsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
      queryClient.setQueryData(queryKeys.jobById(data.id), data);
      toast.success('Job posting updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update job posting');
      console.error('Update job error:', error);
    },
  });
};

// Pipeline Hooks
export const usePipeline = () => {
  return useQuery({
    queryKey: queryKeys.pipeline,
    queryFn: pipelineApi.getAll,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMovePipelineCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, newStage }: { itemId: string; newStage: PipelineStage }) =>
      pipelineApi.moveCandidate(itemId, newStage),
    onMutate: async ({ itemId, newStage }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.pipeline });
      const previousPipeline = queryClient.getQueryData(queryKeys.pipeline);
      
      queryClient.setQueryData(queryKeys.pipeline, (old: any) => 
        old?.map((item: any) => 
          item.id === itemId 
            ? { ...item, stage: newStage, updatedAt: new Date().toISOString() }
            : item
        )
      );
      
      return { previousPipeline };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.pipeline, context?.previousPipeline);
      toast.error('Failed to move candidate');
    },
    onSuccess: () => {
      toast.success('Candidate moved successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
    },
  });
};

export const useAddToPipeline = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
      pipelineApi.addCandidate(candidateId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
      toast.success('Candidate added to pipeline!');
    },
    onError: (error) => {
      toast.error('Failed to add candidate to pipeline');
      console.error('Add to pipeline error:', error);
    },
  });
};

// New: Get AI stage suggestions
export const usePipelineSuggestion = (itemId: string) => {
  return useQuery({
    queryKey: queryKeys.pipelineSuggestion(itemId),
    queryFn: () => pipelineApi.getStageSuggestion(itemId),
    enabled: !!itemId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// New: Update pipeline candidate
export const useUpdatePipelineCandidate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: any }) =>
      pipelineApi.updateCandidate(itemId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
      toast.success('Candidate updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update candidate');
      console.error('Update candidate error:', error);
    },
  });
};

// Offers Hooks
export const useOffers = () => {
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: offersApi.getAll,
    staleTime: 3 * 60 * 1000,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: offersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      toast.success('Offer created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create offer');
      console.error('Create offer error:', error);
    },
  });
};

export const useUpdateOfferStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      offersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      toast.success('Offer status updated!');
    },
    onError: (error) => {
      toast.error('Failed to update offer status');
      console.error('Update offer status error:', error);
    },
  });
};

// New: Get AI-generated offer summary
export const useOfferSummary = (offerId: string) => {
  return useQuery({
    queryKey: queryKeys.offerSummary(offerId),
    queryFn: () => offersApi.generateSummary(offerId),
    enabled: !!offerId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// New: Generate voice narration
export const useGenerateVoiceNarration = () => {
  return useMutation({
    mutationFn: ({ offerId, text }: { offerId: string; text?: string }) =>
      offersApi.generateVoiceNarration(offerId, text),
    onSuccess: () => {
      toast.success('Voice narration generated!');
    },
    onError: (error) => {
      toast.error('Failed to generate voice narration');
      console.error('Voice narration error:', error);
    },
  });
};

// Matches Hooks
export const useMatches = () => {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: matchesApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useMatchesForJob = (jobId: string) => {
  return useQuery({
    queryKey: queryKeys.matchesForJob(jobId),
    queryFn: () => matchesApi.getForJob(jobId),
    enabled: !!jobId,
    staleTime: 10 * 60 * 1000,
  });
};

// New: Get match explanation
export const useMatchExplanation = (candidateId: string, jobId: string) => {
  return useQuery({
    queryKey: queryKeys.matchExplanation(candidateId, jobId),
    queryFn: () => matchesApi.getExplanation(candidateId, jobId),
    enabled: !!candidateId && !!jobId,
    staleTime: 30 * 60 * 1000,
  });
};

// New: Refresh matching index
export const useRefreshMatchIndex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: matchesApi.refreshIndex,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      toast.success('Matching index refresh started!');
    },
    onError: (error) => {
      toast.error('Failed to refresh matching index');
      console.error('Refresh index error:', error);
    },
  });
};

// Dashboard Hooks
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.getKPIs,
    staleTime: 5 * 60 * 1000,
  });
};

// New: Get AI-generated KPI narrative
export const useDashboardNarrative = () => {
  return useQuery({
    queryKey: queryKeys.dashboardNarrative,
    queryFn: dashboardApi.getKPINarrative,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Billing Hooks
export const useBilling = () => {
  return useQuery({
    queryKey: queryKeys.billing,
    queryFn: billingApi.getPlan,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateBillingPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingApi.updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      toast.success('Plan updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update plan');
      console.error('Update plan error:', error);
    },
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: billingApi.addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      toast.success('Payment method added successfully!');
    },
    onError: (error) => {
      toast.error('Failed to add payment method');
      console.error('Add payment method error:', error);
    },
  });
};

// Payouts Hooks
export const usePayouts = () => {
  return useQuery({
    queryKey: queryKeys.payouts,
    queryFn: payoutsApi.list,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePayout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: payoutsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payouts });
      toast.success('Payout created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create payout');
      console.error('Create payout error:', error);
    },
  });
};

// Reports Hooks
export const useAsyncExport = () => {
  return useMutation({
    mutationFn: ({ type, params }: { type: 'csv' | 'pdf'; params: any }) =>
      type === 'csv' ? reportsApi.exportCSVAsync(params) : reportsApi.exportPDFAsync(params),
    onSuccess: (data) => {
      toast.success(`Export started! Job ID: ${data.jobId}`);
    },
    onError: (error) => {
      toast.error('Failed to start export');
      console.error('Export error:', error);
    },
  });
};

export const useExportStatus = (jobId: string) => {
  return useQuery({
    queryKey: queryKeys.exportStatus(jobId),
    queryFn: () => reportsApi.getExportStatus(jobId),
    enabled: !!jobId,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 0,
  });
};