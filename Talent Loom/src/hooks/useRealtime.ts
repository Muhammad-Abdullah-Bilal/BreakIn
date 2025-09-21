// Enhanced realtime functionality with comprehensive event handling
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './useApi';
import { toast } from 'sonner';

interface RealtimeEvent {
  type: 'pipeline.created' | 'pipeline.moved' | 'pipeline.updated' | 
        'jobs.created' | 'jobs.updated' | 'jobs.archived' |
        'offers.created' | 'offers.updated' |
        'reports.ready' |
        'matches.updated';
  payload: any;
  timestamp: string;
  companyId?: string;
  jobId?: string;
}

// Enhanced mock realtime events
const mockEvents: RealtimeEvent[] = [
  {
    type: 'pipeline.moved',
    payload: { candidateId: '1', newStage: 'interview', candidateName: 'Sarah Chen', jobId: '1' },
    timestamp: new Date().toISOString(),
    companyId: 'company_1',
    jobId: '1'
  },
  {
    type: 'offers.created',
    payload: { candidateId: '2', jobTitle: 'Backend Engineer', candidateName: 'Marcus Johnson', offerId: 'offer_1' },
    timestamp: new Date().toISOString(),
    companyId: 'company_1',
    jobId: '2'
  },
  {
    type: 'jobs.created',
    payload: { jobId: '3', title: 'Full Stack Developer', companyName: 'TechCorp' },
    timestamp: new Date().toISOString(),
    companyId: 'company_1'
  },
  {
    type: 'reports.ready',
    payload: { exportId: 'export_123', type: 'csv', downloadUrl: 'https://api.talentloom.com/exports/export_123' },
    timestamp: new Date().toISOString(),
    companyId: 'company_1'
  },
  {
    type: 'matches.updated',
    payload: { jobId: '1', newMatchesCount: 5, topScore: 95 },
    timestamp: new Date().toISOString(),
    companyId: 'company_1',
    jobId: '1'
  }
];

export const useRealtime = (companyId?: string) => {
  const queryClient = useQueryClient();
  const eventIndexRef = useRef(0);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    // Filter events by company if specified
    if (companyId && event.companyId && event.companyId !== companyId) {
      return;
    }

    switch (event.type) {
      case 'pipeline.moved':
        queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
        if (event.jobId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.matchesForJob(event.jobId) });
        }
        toast.info(`${event.payload.candidateName} moved to ${event.payload.newStage} stage`);
        break;
        
      case 'pipeline.created':
        queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        toast.info(`New candidate added to pipeline`);
        break;

      case 'pipeline.updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.pipeline });
        break;
        
      case 'offers.created':
        queryClient.invalidateQueries({ queryKey: queryKeys.offers });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        toast.info(`New offer created for ${event.payload.candidateName}`);
        break;
        
      case 'offers.updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.offers });
        if (event.payload.offerId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.offerSummary(event.payload.offerId) });
        }
        toast.info(`Offer status updated`);
        break;
        
      case 'jobs.created':
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        toast.info(`New job posting created: ${event.payload.title}`);
        break;

      case 'jobs.updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
        if (event.jobId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.jobById(event.jobId) });
        }
        break;

      case 'jobs.archived':
        queryClient.invalidateQueries({ queryKey: queryKeys.jobs });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        toast.info(`Job posting archived`);
        break;

      case 'reports.ready':
        if (event.payload.exportId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.exportStatus(event.payload.exportId) });
        }
        toast.success(`${event.payload.type.toUpperCase()} export ready for download!`, {
          action: {
            label: 'Download',
            onClick: () => window.open(event.payload.downloadUrl, '_blank')
          }
        });
        break;

      case 'matches.updated':
        if (event.jobId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.matchesForJob(event.jobId) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.matches });
        toast.info(`New matches found: ${event.payload.newMatchesCount} candidates`);
        break;
        
      default:
        console.log('Unknown realtime event:', event);
    }
  }, [queryClient, companyId]);

  useEffect(() => {
    // Simulate realtime events every 45 seconds
    const interval = setInterval(() => {
      if (eventIndexRef.current < mockEvents.length) {
        const event = mockEvents[eventIndexRef.current];
        handleRealtimeEvent(event);
        eventIndexRef.current++;
      } else {
        // Reset to beginning for demo purposes
        eventIndexRef.current = 0;
      }
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [handleRealtimeEvent]);

  const subscribe = useCallback((channels: string[]) => {
    channels.forEach(channel => subscribedChannelsRef.current.add(channel));
    console.log('Subscribed to channels:', channels);
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    channels.forEach(channel => subscribedChannelsRef.current.delete(channel));
    console.log('Unsubscribed from channels:', channels);
  }, []);

  const publish = useCallback((channel: string, event: Omit<RealtimeEvent, 'timestamp'>) => {
    const fullEvent: RealtimeEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      companyId: companyId || 'company_1'
    };
    
    // In a real implementation, this would send to the server
    console.log('Publishing event to channel:', channel, fullEvent);
    
    // Simulate immediate local handling for demo
    setTimeout(() => handleRealtimeEvent(fullEvent), 100);
  }, [handleRealtimeEvent, companyId]);

  return {
    isConnected: true,
    lastEvent: mockEvents[Math.min(eventIndexRef.current - 1, mockEvents.length - 1)] || null,
    subscribedChannels: Array.from(subscribedChannelsRef.current),
    subscribe,
    unsubscribe,
    publish
  };
};

// Enhanced hook for specific realtime subscriptions with lifecycle management
export const useRealtimeSubscription = (channels: string[], companyId?: string) => {
  const { subscribe, unsubscribe, isConnected } = useRealtime(companyId);

  useEffect(() => {
    if (channels.length > 0) {
      subscribe(channels);
      
      return () => {
        unsubscribe(channels);
      };
    }
  }, [channels, subscribe, unsubscribe]);

  return {
    isSubscribed: isConnected && channels.length > 0,
    channels,
    isConnected
  };
};

// Specialized hooks for different subscription patterns
export const usePipelineSubscription = (jobId?: string, companyId?: string) => {
  const channels = jobId 
    ? [`pipeline.${companyId || 'company_1'}`, `pipeline.${jobId}`]
    : [`pipeline.${companyId || 'company_1'}`];
    
  return useRealtimeSubscription(channels, companyId);
};

export const useJobsSubscription = (companyId?: string) => {
  const channels = [`jobs.${companyId || 'company_1'}`];
  return useRealtimeSubscription(channels, companyId);
};

export const useOffersSubscription = (companyId?: string) => {
  const channels = [`offers.${companyId || 'company_1'}`];
  return useRealtimeSubscription(channels, companyId);
};

export const useReportsSubscription = (companyId?: string) => {
  const channels = [`reports.${companyId || 'company_1'}`];
  return useRealtimeSubscription(channels, companyId);
};