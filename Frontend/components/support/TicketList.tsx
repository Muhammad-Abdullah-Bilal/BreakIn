'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/lib/services/identity-api';
import { SupportTicket } from '@/lib/types/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { 
  Search,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Eye,
  MessageCircle,
  User,
  Calendar,
  Tag,
  ArrowUp,
  ArrowDown,
  Minus,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Paperclip
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { useInView } from 'react-intersection-observer';
import { useToast } from '@/hooks/use-toast';

interface TicketFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
}

interface TicketListProps {
  onTicketSelect: (ticket: SupportTicket) => void;
  selectedTicketId?: string;
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'critical':
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case 'high':
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    case 'medium':
      return <Minus className="h-4 w-4 text-yellow-500" />;
    case 'low':
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'open':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'waiting_for_customer':
      return <MessageCircle className="h-4 w-4 text-purple-500" />;
    case 'resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'open':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'waiting_for_customer':
      return 'outline';
    case 'resolved':
      return 'secondary';
    case 'closed':
      return 'outline';
    default:
      return 'outline';
  }
}

export function TicketList({ onTicketSelect, selectedTicketId }: TicketListProps) {
  const [filters, setFilters] = useState<TicketFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);
  const { ref, inView } = useInView();
  const { toast } = useToast();

  // Fetch tickets with pagination and filtering
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['supportTickets', debouncedSearch, filters],
    queryFn: ({ pageParam = 0 }) => 
      supportService.getTickets({
        page: pageParam,
        limit: 20,
        search: debouncedSearch || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        priority: filters.priority !== 'all' ? filters.priority : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        assignedTo: filters.assignedTo !== 'all' ? filters.assignedTo : undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Load more when scrolling to bottom
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allTickets = data?.pages.flatMap(page => page.tickets) || [];

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isError) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Tickets</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong while loading the tickets.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Support Tickets</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_for_customer">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.assignedTo}
              onValueChange={(value) => handleFilterChange('assignedTo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-16" />
                  </div>
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-muted rounded w-12" />
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            allTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedTicketId === ticket.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onTicketSelect(ticket)}
              >
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{ticket.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        #{ticket.id.slice(-8)} • {ticket.user.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {getPriorityIcon(ticket.priority)}
                    </div>
                  </div>

                  {/* Description Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </Badge>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {ticket.messageCount > 1 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{ticket.messageCount}</span>
                        </div>
                      )}
                      {ticket.attachmentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>{ticket.attachmentCount}</span>
                        </div>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Load More Trigger */}
          {hasNextPage && (
            <div ref={ref} className="py-4 text-center">
              {isFetchingNextPage ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading more tickets...
                </div>
              ) : (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load More
                </Button>
              )}
            </div>
          )}
          
          {/* No Results */}
          {allTickets.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some(f => f !== 'all' && f !== '')
                  ? 'No tickets match your current filters.'
                  : 'No support tickets yet.'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}