import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Eye, 
  Clock, 
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  MoreHorizontal,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { useOffers, useCreateOffer, useCandidates, useJobs, useOfferSummary, useGenerateVoiceNarration } from "@/hooks/useApi";
import { useOffersSubscription } from "@/hooks/useRealtime";
import { Offer } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { offerSchema, OfferFormData } from "@/lib/validations";

export default function Offers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  
  const { data: offers, isLoading, error } = useOffers();
  const { data: candidates } = useCandidates();
  const { data: jobs } = useJobs();
  const createOfferMutation = useCreateOffer();
  const generateVoiceMutation = useGenerateVoiceNarration();
  
  // Subscribe to offer updates
  useOffersSubscription();
  
  // Get AI summary for selected offer
  const { data: offerSummary, isLoading: summaryLoading } = useOfferSummary(selectedOfferId || '');

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      candidateId: '',
      jobId: '',
      salary: {
        amount: 0,
        currency: 'USD',
        frequency: 'yearly',
      },
      startDate: '',
      expiresAt: '',
      terms: '',
      benefits: [],
    },
  });

  const onSubmit = (data: OfferFormData) => {
    const candidate = candidates?.find(c => c.id === data.candidateId);
    const job = jobs?.find(j => j.id === data.jobId);
    
    if (!candidate || !job) return;

    createOfferMutation.mutate({
      ...data,
      candidate,
      jobTitle: job.title,
      status: 'draft' as const,
      benefits: data.benefits || [],
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        form.reset();
      },
    });
  };

  const handleGenerateVoice = (offerId: string) => {
    generateVoiceMutation.mutate({ offerId });
  };

  const handleViewSummary = (offerId: string) => {
    setSelectedOfferId(offerId);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load offers data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = (status: Offer['status']) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'sent': return <Send className="w-4 h-4 text-blue-600" />;
      case 'viewed': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'expired': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Offer['status']) => {
    switch (status) {
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      case 'sent': return 'secondary';
      case 'viewed': return 'outline';
      case 'expired': return 'outline';
      default: return 'outline';
    }
  };

  const OfferCard = ({ offer }: { offer: Offer }) => {
    const daysUntilExpiry = Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpiring = daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry <= 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={offer.candidate.avatar} />
                <AvatarFallback>
                  {offer.candidate.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{offer.candidate.name}</CardTitle>
                <CardDescription>{offer.jobTitle}</CardDescription>
                <div className="flex items-center mt-2">
                  <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    ${offer.salary.amount.toLocaleString()} {offer.salary.currency} / {offer.salary.frequency}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(offer.status)} className="flex items-center gap-1">
                {getStatusIcon(offer.status)}
                {offer.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Offer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewSummary(offer.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    AI Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerateVoice(offer.id)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Voice
                  </DropdownMenuItem>
                  {offer.status === 'draft' && (
                    <DropdownMenuItem>
                      <Send className="w-4 h-4 mr-2" />
                      Send Offer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Offer Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <div className="font-medium">
                {new Date(offer.startDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-medium">
                {new Date(offer.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Benefits */}
          {offer.benefits.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Benefits:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {offer.benefits.slice(0, 3).map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
                {offer.benefits.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{offer.benefits.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Expiry Warning */}
          {(isExpiring || isExpired) && (
            <div className={`p-3 rounded-lg ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center">
                <Clock className={`w-4 h-4 mr-2 ${isExpired ? 'text-red-600' : 'text-yellow-600'}`} />
                <span className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
                  {isExpired ? 'Offer expired' : `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Timeline:</h5>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Created {new Date(offer.createdAt).toLocaleDateString()}
              </div>
              {offer.sentAt && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Sent {new Date(offer.sentAt).toLocaleDateString()}
                </div>
              )}
              {offer.respondedAt && (
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${offer.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {offer.status === 'accepted' ? 'Accepted' : 'Rejected'} {new Date(offer.respondedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {offer.status === 'draft' && (
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                <Send className="w-3 h-3 mr-1" />
                Send Offer
              </Button>
              <Button size="sm" variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const CreateOfferDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Create a new job offer for a candidate
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="candidateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {candidates?.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Position</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobs?.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salary.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="120000" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salary.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer Expires</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the terms and conditions for this offer..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createOfferMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createOfferMutation.isPending}>
                {createOfferMutation.isPending ? 'Creating...' : 'Create Offer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  const totalOffers = offers?.length || 0;
  const pendingOffers = offers?.filter(o => ['sent', 'viewed'].includes(o.status)).length || 0;
  const acceptedOffers = offers?.filter(o => o.status === 'accepted').length || 0;
  const rejectedOffers = offers?.filter(o => o.status === 'rejected').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offers Management</h1>
          <p className="text-muted-foreground">
            Create, send, and track job offers with automated workflows
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Offers</CardTitle>
                <div className="text-2xl font-bold">{totalOffers}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Response</CardTitle>
                <div className="text-2xl font-bold text-yellow-600">{pendingOffers}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
                <div className="text-2xl font-bold text-green-600">{acceptedOffers}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                <div className="text-2xl font-bold text-red-600">{rejectedOffers}</div>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="salary-high">Highest Salary</SelectItem>
                <SelectItem value="salary-low">Lowest Salary</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offer Listings */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-16" />
                  ))}
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          offers?.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          )) || []
        )}
      </div>

      <CreateOfferDialog />

      {/* AI Summary Panel */}
      {selectedOfferId && (
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  AI Offer Summary
                </CardTitle>
                <CardDescription>
                  Intelligent analysis and summary of the offer details
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleGenerateVoice(selectedOfferId)}
                  disabled={generateVoiceMutation.isPending}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {generateVoiceMutation.isPending ? 'Generating...' : 'Generate Voice'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOfferId(null)}>
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : offerSummary ? (
              <p className="text-sm leading-relaxed">{offerSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No summary available.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}