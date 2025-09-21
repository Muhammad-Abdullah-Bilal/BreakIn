# TalentLoom - AI-Powered Recruiting Platform

A comprehensive recruiting platform built with React, TypeScript, and advanced AI integrations including Coral Protocol MCP, Crossmint payments, and ElevenLabs voice generation.

## 🚀 Features

### Core Recruiting Functionality
- **AI-Powered Dashboard**: Real-time KPIs with intelligent narratives
- **Semantic Candidate Discovery**: Advanced search using embeddings and AI matching
- **Smart Pipeline Management**: Kanban board with AI stage suggestions
- **Intelligent Matching**: AI-ranked candidates with detailed explanations
- **Automated Offers**: AI-generated summaries with voice narration
- **Advanced Analytics**: Comprehensive reports with async exports

### AI & ML Integrations

#### Coral Protocol MCP (Model Context Protocol)
- **Discovery & Search**: Semantic search, batch embeddings, reranking
- **AI Matching**: Candidate ranking with natural language explanations
- **Pipeline Intelligence**: Non-binding stage suggestions with confidence scores
- **Content Generation**: Offer summaries and KPI narratives
- **Long-Running Flows**: Async CSV/PDF exports, index rebuilding

#### Crossmint Payments
- **Wallet Management**: Company and contractor wallet creation/linking
- **Payment Processing**: Secure payment method management
- **Invoice System**: Automated invoice generation and payment
- **Payout Tracking**: Real-time payout status monitoring

#### ElevenLabs Voice AI (Optional)
- **Voice Narration**: Convert offer summaries to speech
- **Pipeline Reports**: Audio summaries of weekly performance

### Real-time Features
- **Live Updates**: WebSocket-style event handling
- **Channel Subscriptions**: Pipeline, jobs, offers, reports
- **Optimistic UI**: Immediate feedback with rollback on conflicts
- **Event Publishing**: Real-time notifications across the platform

## 🏗️ Architecture

### Service Interfaces (API-Ready)
```typescript
// Recruiter API
recruiter.api: {
  searchCandidates(filters)
  getCandidate(id)
  listMatches(jobId)
  jobPostings: { list, create, update, archive }
  shortlist(candidateId, jobId)
}

// Pipeline API
pipeline.api: {
  listPipeline(jobId)
  moveCandidate(itemId, toStage)
  updateCandidate(itemId, patch)
  getStageSuggestion(itemId) // AI-powered
}

// Offers API
offers.api: {
  list(jobId)
  create(jobId, candidateId, payload)
  updateStatus(offerId, status)
  generateSummary(offerId) // AI-powered
  generateVoiceNarration(offerId) // ElevenLabs
}

// Billing API (Crossmint)
billing.api: {
  getPlan()
  updatePlan(planId)
  addPaymentMethod()
  processPayment(amount, currency, method)
  listInvoices()
}
```

### Domain Types
```typescript
// Core entities
Candidate, ProofItem, MatchScore
JobPosting, PipelineStage, PipelineItem
Offer, Contract, Invoice, Payout, ReportRow

// Pipeline stages
'sourced' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected'
```

### Realtime Channels
```typescript
// Subscription patterns
pipeline.{companyId|jobId} → pipeline.created, pipeline.moved, pipeline.updated
jobs.* → jobs.created, jobs.updated, jobs.archived
offers.* → offers.created, offers.updated
reports.* → reports.ready
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + Radix UI components
- **TanStack Query** for state management
- **React Router** for navigation
- **React Hook Form** + Zod validation
- **Sonner** for notifications

### AI & External Services
- **Coral Protocol MCP** - AI agent tools
- **Crossmint** - Crypto payments & wallets
- **ElevenLabs** - Text-to-speech generation
- **Mistral AI** - Cost-effective ML models (recommended)

### Development Tools
- **Vite** for build tooling
- **ESLint** for code quality
- **TypeScript** for type safety

## 🚦 Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Open in browser**: [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Radix UI components
│   └── layout/          # App layout components
├── pages/               # Route components
│   ├── Dashboard.tsx    # AI-powered insights
│   ├── Candidates.tsx   # Semantic search & discovery
│   ├── Pipeline.tsx     # Kanban with AI suggestions
│   ├── Matches.tsx      # AI matching with explanations
│   ├── Offers.tsx       # AI summaries & voice
│   ├── Reports.tsx      # Analytics & async exports
│   ├── Billing.tsx      # Crossmint integration
│   └── Settings.tsx     # User preferences
├── hooks/
│   ├── useApi.ts        # React Query hooks
│   └── useRealtime.ts   # WebSocket-style events
├── lib/
│   ├── api.ts           # API layer with service integration
│   ├── coral-mcp.ts     # Coral Protocol MCP client
│   ├── validations.ts   # Zod schemas
│   └── mockData.ts      # Development data
└── types/
    └── index.ts         # TypeScript definitions
```

## 🔧 Configuration

### Environment Variables
```env
# Coral Protocol
VITE_CORAL_MCP_ENDPOINT=https://api.coral.dev
VITE_CORAL_API_KEY=your_coral_key

# Crossmint
VITE_CROSSMINT_API_KEY=your_crossmint_key
VITE_CROSSMINT_ENVIRONMENT=staging

# ElevenLabs (Optional)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

### MCP Server Configuration
The app includes mock implementations that can be replaced with actual MCP servers:

```typescript
// Real MCP integration example
const coralMCP = new CoralMCPClient({
  endpoint: process.env.VITE_CORAL_MCP_ENDPOINT,
  apiKey: process.env.VITE_CORAL_API_KEY
});
```

## 🧪 Testing Strategy

### Unit Tests
- Hooks (filters, queries, mutations)
- Job posting lifecycle
- Offer status transitions

### Integration Tests
- Pipeline drag & drop
- Shortlist workflow
- Job posting autosave

### E2E Tests
- Dashboard → search → shortlist → pipeline flow
- Offer creation and management
- Report generation and export

### Accessibility Tests
- Keyboard navigation
- ARIA roles and labels
- Focus management

## 📊 Performance Features

- **Virtualized Lists**: Handle large candidate datasets
- **Optimistic Updates**: Immediate UI feedback
- **Query Caching**: Intelligent data caching with React Query
- **Lazy Loading**: Route-based code splitting
- **Realtime Reconciliation**: Conflict resolution for concurrent updates

## 🔒 Security & Privacy

- **Role-based Access**: Recruiter/company permissions
- **Data Anonymization**: PII protection in logs
- **Secure Payments**: Crossmint wallet integration
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schema validation

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Environment Setup
1. Configure environment variables
2. Set up Coral MCP endpoints
3. Configure Crossmint webhooks
4. Deploy to your preferred platform

## 📈 Monitoring & Analytics

- **Real-time KPIs**: Hiring performance metrics
- **AI Insights**: Automated performance narratives
- **Export Capabilities**: CSV/PDF report generation
- **Usage Analytics**: Track feature adoption
- **Error Monitoring**: Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For technical support or questions:
- Check the documentation
- Review the API interfaces
- Test with mock data first
- Verify environment configuration

---

**TalentLoom** - Revolutionizing recruitment with AI-powered intelligence and seamless integrations.