// Enhanced API functions with Coral MCP and external service integration
import { mockCandidates, mockJobPostings, mockPipelineItems, mockOffers, mockKPIData, mockMatchScores, mockApiDelay } from './mockData';
import { Candidate, JobPosting, PipelineItem, Offer, KPIData, MatchScore, CandidateFilters, PipelineStage } from '@/types';
import { coralMCP, coralStudio, aimlClient, crossmintClient, elevenLabsClient } from './coral-mcp';

// Enhanced Candidates API with Coral MCP integration
export const candidatesApi = {
  getAll: async (filters?: Partial<CandidateFilters>): Promise<Candidate[]> => {
    await mockApiDelay(800);
    let candidates = [...mockCandidates];
    
    if (filters?.skills?.length) {
      candidates = candidates.filter(c => 
        filters.skills!.some(skill => 
          c.skills.some(cSkill => cSkill.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }
    
    if (filters?.availability?.length) {
      candidates = candidates.filter(c => filters.availability!.includes(c.availability));
    }
    
    if (filters?.track) {
      candidates = candidates.filter(c => c.track === filters.track);
    }
    
    return candidates;
  },
  
  getById: async (id: string): Promise<Candidate | null> => {
    await mockApiDelay(500);
    return mockCandidates.find(c => c.id === id) || null;
  },
  
  search: async (query: string): Promise<Candidate[]> => {
    await mockApiDelay(600);
    
    // Use Coral MCP for semantic search
    try {
      const semanticResults = await coralMCP.search.semantic(query, {});
      const candidateIds = semanticResults.map(r => r.id);
      const candidates = mockCandidates.filter(c => candidateIds.includes(c.id));
      
      // Rerank results for precision
      const reranked = await coralMCP.search.rerank.list(query, candidates);
      return reranked;
    } catch (error) {
      // Fallback to basic search
      return mockCandidates.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
      );
    }
  },
  
  // New: Semantic discovery
  discover: async (jobId: string, filters?: Partial<CandidateFilters>): Promise<Candidate[]> => {
    await mockApiDelay(1000);
    
    try {
      const job = mockJobPostings.find(j => j.id === jobId);
      if (!job) return [];
      
      // Create search query from job requirements
      const searchQuery = `${job.title} ${job.skills.join(' ')} ${job.requirements.join(' ')}`;
      
      // Use semantic search
      const results = await coralMCP.search.semantic(searchQuery, filters);
      return results.map(r => r.candidate).filter(Boolean);
    } catch (error) {
      return mockCandidates.slice(0, 10);
    }
  }
};

// Jobs API
export const jobsApi = {
  getAll: async (): Promise<JobPosting[]> => {
    await mockApiDelay(700);
    return [...mockJobPostings];
  },
  
  getById: async (id: string): Promise<JobPosting | null> => {
    await mockApiDelay(500);
    return mockJobPostings.find(j => j.id === id) || null;
  },
  
  create: async (job: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobPosting> => {
    await mockApiDelay(1000);
    const newJob: JobPosting = {
      ...job,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newJob;
  },
  
  update: async (id: string, updates: Partial<JobPosting>): Promise<JobPosting> => {
    await mockApiDelay(800);
    const job = mockJobPostings.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return { ...job, ...updates, updatedAt: new Date().toISOString() };
  }
};

// Enhanced Pipeline API with AI suggestions
export const pipelineApi = {
  getAll: async (): Promise<PipelineItem[]> => {
    await mockApiDelay(600);
    return [...mockPipelineItems];
  },
  
  moveCandidate: async (itemId: string, newStage: PipelineStage): Promise<PipelineItem> => {
    await mockApiDelay(500);
    const item = mockPipelineItems.find(i => i.id === itemId);
    if (!item) throw new Error('Pipeline item not found');
    return { ...item, stage: newStage, updatedAt: new Date().toISOString() };
  },
  
  addCandidate: async (candidateId: string, jobId: string): Promise<PipelineItem> => {
    await mockApiDelay(800);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    const job = mockJobPostings.find(j => j.id === jobId);
    if (!candidate || !job) throw new Error('Candidate or job not found');
    
    const newItem: PipelineItem = {
      id: Date.now().toString(),
      candidateId,
      candidate,
      jobId,
      jobTitle: job.title,
      stage: 'sourced',
      notes: '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addedBy: 'Current User'
    };
    return newItem;
  },
  
  // New: Get AI suggestions for next stage
  getStageSuggestion: async (itemId: string): Promise<{
    stage: PipelineStage;
    confidence: number;
    reasoning: string;
  }> => {
    try {
      const suggestion = await coralMCP.pipeline.suggest_next_stage(itemId);
      return {
        stage: suggestion.stage as PipelineStage,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning
      };
    } catch (error) {
      return {
        stage: 'interview',
        confidence: 0.7,
        reasoning: 'Based on candidate profile and current stage, interview is the recommended next step.'
      };
    }
  },
  
  // New: Update candidate with notes/feedback
  updateCandidate: async (itemId: string, patch: Partial<PipelineItem>): Promise<PipelineItem> => {
    await mockApiDelay(400);
    const item = mockPipelineItems.find(i => i.id === itemId);
    if (!item) throw new Error('Pipeline item not found');
    return { ...item, ...patch, updatedAt: new Date().toISOString() };
  }
};

// Enhanced Offers API with AI summaries and voice generation
export const offersApi = {
  getAll: async (): Promise<Offer[]> => {
    await mockApiDelay(700);
    return [...mockOffers];
  },
  
  create: async (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> => {
    await mockApiDelay(1000);
    const newOffer: Offer = {
      ...offer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newOffer;
  },
  
  updateStatus: async (id: string, status: Offer['status']): Promise<Offer> => {
    await mockApiDelay(600);
    const offer = mockOffers.find(o => o.id === id);
    if (!offer) throw new Error('Offer not found');
    return { ...offer, status, updatedAt: new Date().toISOString() };
  },
  
  // New: Generate AI summary of offer
  generateSummary: async (offerId: string): Promise<string> => {
    try {
      return await coralMCP.offer.generate_summary(offerId);
    } catch (error) {
      return "Comprehensive offer package with competitive compensation and benefits.";
    }
  },
  
  // New: Generate voice narration of offer (ElevenLabs)
  generateVoiceNarration: async (offerId: string, text?: string): Promise<{ audioUrl: string }> => {
    try {
      const summary = text || await coralMCP.offer.generate_summary(offerId);
      return await elevenLabsClient.textToSpeech.generate(summary);
    } catch (error) {
      return { audioUrl: '' };
    }
  }
};

// Enhanced Matches API with AI-powered ranking and explanations
export const matchesApi = {
  getAll: async (): Promise<MatchScore[]> => {
    await mockApiDelay(800);
    return [...mockMatchScores];
  },
  
  getForJob: async (jobId: string): Promise<MatchScore[]> => {
    await mockApiDelay(600);
    
    try {
      // Get candidates for this job
      const candidateIds = mockCandidates.map(c => c.id);
      
      // Use Coral MCP for AI ranking
      const rankedMatches = await coralMCP.match.rank(jobId, candidateIds);
      
      // Enhance with explanations
      const enhancedMatches = await Promise.all(
        rankedMatches.map(async (match) => {
          const explanation = await coralMCP.match.explain(match.candidateId, jobId);
          const candidate = mockCandidates.find(c => c.id === match.candidateId);
          
          return {
            ...match,
            reasons: [explanation],
            skillsMatch: match.score * 0.9 + Math.random() * 10,
            experienceMatch: match.score * 0.85 + Math.random() * 15,
            availabilityMatch: Math.random() * 20 + 80,
            locationMatch: Math.random() * 30 + 70
          };
        })
      );
      
      return enhancedMatches;
    } catch (error) {
      return mockMatchScores.filter(m => m.jobId === jobId);
    }
  },
  
  // New: Get match explanation
  getExplanation: async (candidateId: string, jobId: string): Promise<string> => {
    try {
      return await coralMCP.match.explain(candidateId, jobId);
    } catch (error) {
      return "This candidate shows strong alignment with the role requirements based on skills, experience, and availability.";
    }
  },
  
  // New: Refresh matching index
  refreshIndex: async (): Promise<{ jobId: string }> => {
    return await coralStudio.matches.refresh_index();
  }
};

// Enhanced Dashboard API with AI narratives
export const dashboardApi = {
  getKPIs: async (): Promise<KPIData> => {
    await mockApiDelay(500);
    return { ...mockKPIData };
  },
  
  // New: Get AI-generated KPI narratives
  getKPINarrative: async (): Promise<string> => {
    try {
      const kpis = await dashboardApi.getKPIs();
      return await coralMCP.report.narrate_kpis(kpis);
    } catch (error) {
      return "Your hiring performance shows positive trends across key metrics.";
    }
  }
};

// Enhanced Reports API with async exports via Coral Studio
export const reportsApi = {
  exportCSV: async (data: any[]): Promise<string> => {
    await mockApiDelay(2000);
    // Mock CSV generation
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
  },
  
  exportPDF: async (data: any[]): Promise<Blob> => {
    await mockApiDelay(3000);
    // Mock PDF generation
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  },
  
  // New: Async CSV export via Coral Studio
  exportCSVAsync: async (params: any): Promise<{ jobId: string }> => {
    return await coralStudio.reports.export_csv(params);
  },
  
  // New: Async PDF export via Coral Studio
  exportPDFAsync: async (params: any): Promise<{ jobId: string }> => {
    return await coralStudio.reports.export_pdf(params);
  },
  
  // New: Get export job status
  getExportStatus: async (jobId: string): Promise<{ status: string; downloadUrl?: string }> => {
    await mockApiDelay(500);
    const statuses = ['processing', 'completed', 'failed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status,
      downloadUrl: status === 'completed' ? `https://api.talentloom.com/exports/${jobId}` : undefined
    };
  }
};

// Enhanced Billing API with Crossmint integration
export const billingApi = {
  getPlan: async () => {
    await mockApiDelay(500);
    return {
      name: "Professional",
      price: 299,
      currency: "USD",
      frequency: "monthly",
      features: [
        "Up to 50 active job postings",
        "Unlimited candidate searches", 
        "Advanced AI matching",
        "Pipeline management",
        "Custom reports & analytics",
        "Priority support"
      ]
    };
  },
  
  updatePlan: async (planName: string) => {
    await mockApiDelay(1500);
    return { success: true, message: `Successfully upgraded to ${planName} plan` };
  },
  
  addPaymentMethod: async (paymentData: any) => {
    try {
      // Create wallet if needed
      const wallet = await crossmintClient.wallets.create('company', { userId: 'current_user' });
      
      // Add payment method via Crossmint
      const paymentMethod = await crossmintClient.payments.createPaymentMethod(wallet.id, paymentData);
      
      return { success: true, id: paymentMethod.id, walletId: wallet.id };
    } catch (error) {
      await mockApiDelay(1000);
      return { success: true, id: 'pm_' + Date.now() };
    }
  },
  
  processPayment: async (amount: number, currency: string, methodId: string) => {
    try {
      const result = await crossmintClient.payments.processPayment(amount, currency, methodId);
      return result;
    } catch (error) {
      await mockApiDelay(1500);
      return { id: `pay_${Date.now()}`, status: 'succeeded' };
    }
  },
  
  listInvoices: async () => {
    await mockApiDelay(600);
    return [
      {
        id: "INV-2024-001",
        date: "2024-03-01",
        amount: 299,
        status: "paid",
        description: "Professional Plan - March 2024"
      }
    ];
  },
  
  getInvoice: async (id: string) => {
    await mockApiDelay(500);
    return {
      id,
      date: "2024-03-01",
      amount: 299,
      status: "paid",
      description: "Professional Plan - March 2024"
    };
  },
  
  // New: Create invoice via Crossmint
  createInvoice: async (invoiceData: any) => {
    try {
      return await crossmintClient.invoices.create(invoiceData);
    } catch (error) {
      await mockApiDelay(800);
      return { id: `inv_${Date.now()}`, url: `https://billing.talentloom.com/invoices/inv_${Date.now()}` };
    }
  }
};

// Enhanced Payouts API with Crossmint integration
export const payoutsApi = {
  list: async () => {
    await mockApiDelay(700);
    return [
      {
        id: "payout_1",
        candidateId: "1",
        amount: 5000,
        currency: "USD",
        status: "completed",
        description: "Placement fee for Sarah Chen",
        processedAt: "2024-03-15T00:00:00Z",
        createdAt: "2024-03-10T00:00:00Z"
      }
    ];
  },
  
  get: async (id: string) => {
    await mockApiDelay(500);
    return {
      id,
      candidateId: "1",
      amount: 5000,
      currency: "USD", 
      status: "completed",
      description: "Placement fee for Sarah Chen",
      processedAt: "2024-03-15T00:00:00Z",
      createdAt: "2024-03-10T00:00:00Z"
    };
  },
  
  // New: Create payout via Crossmint
  create: async (payoutData: any) => {
    try {
      return await crossmintClient.payouts.create(payoutData);
    } catch (error) {
      await mockApiDelay(1000);
      return {
        id: `payout_${Date.now()}`,
        status: 'processing'
      };
    }
  },
  
  // New: Track payout status
  track: async (payoutId: string) => {
    try {
      return await crossmintClient.payouts.track(payoutId);
    } catch (error) {
      await mockApiDelay(500);
      return {
        status: 'processing',
        eta: '2-3 business days'
      };
    }
  }
};