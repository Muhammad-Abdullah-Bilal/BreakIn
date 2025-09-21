'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/lib/services/identity-api';
import { SupportTicket, TicketMessage } from '@/lib/types/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Send,
  Paperclip,
  Download,
  Edit,
  Trash2,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  EyeOff,
  RefreshCw,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Minus,
  Flag,
  Archive,
  Forward,
  Reply,
  FileText,
  Image,
  File
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const messageFormSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  isInternal: z.boolean().default(false),
});

const ticketUpdateSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
});

type MessageFormData = z.infer<typeof messageFormSchema>;
type TicketUpdateData = z.infer<typeof ticketUpdateSchema>;

interface TicketDetailProps {
  ticketId: string;
}

interface MessageItemProps {
  message: TicketMessage;
  isInternal?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isInternal = false }) => {
  const isFromCustomer = message.sender.role === 'customer';
  
  return (
    <div className={`flex gap-4 ${isFromCustomer ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback>
          {message.sender.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 max-w-[80%] ${isFromCustomer ? '' : 'flex flex-col items-end'}`}>
        <div className={`rounded-lg p-4 ${
          isFromCustomer 
            ? 'bg-muted' 
            : isInternal 
              ? 'bg-orange-50 border border-orange-200' 
              : 'bg-primary text-primary-foreground'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{message.sender.name}</span>
              {isInternal && (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Internal
                </Badge>
              )}
            </div>
            <span className="text-xs opacity-70">
              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
          
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs opacity-70">Attachments:</div>
              <div className="space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {attachment.type.startsWith('image/') ? (
                      <Image className="h-3 w-3" />
                    ) : (
                      <File className="h-3 w-3" />
                    )}
                    <span>{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

function getStatusIcon(status: string) {
  switch (status) {
    case 'open':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'waiting_for_customer':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ticket details
  const { 
    data: ticket, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['supportTicket', ticketId],
    queryFn: () => supportService.getTicket(ticketId),
    enabled: !!ticketId,
  });

  // Fetch ticket messages
  const { data: messages } = useQuery({
    queryKey: ['ticketMessages', ticketId],
    queryFn: () => supportService.getTicketMessages(ticketId),
    enabled: !!ticketId,
  });

  // Message form
  const {
    register: registerMessage,
    handleSubmit: handleMessageSubmit,
    reset: resetMessage,
    watch: watchMessage,
    formState: { errors: messageErrors, isSubmitting: isSubmittingMessage },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      isInternal: false,
    },
  });

  // Update form
  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    setValue: setUpdateValue,
    formState: { errors: updateErrors, isSubmitting: isSubmittingUpdate },
  } = useForm<TicketUpdateData>({
    resolver: zodResolver(ticketUpdateSchema),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: MessageFormData) => 
      supportService.addTicketMessage(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      resetMessage();
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error sending message',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: (data: TicketUpdateData) => 
      supportService.updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTicket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
      setShowUpdateDialog(false);
      toast({
        title: 'Ticket updated',
        description: 'The ticket has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating ticket',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const onSendMessage = (data: MessageFormData) => {
    sendMessageMutation.mutate(data);
  };

  const onUpdateTicket = (data: TicketUpdateData) => {
    updateTicketMutation.mutate(data);
  };

  const handleQuickStatusChange = (status: string) => {
    updateTicketMutation.mutate({ status });
  };

  // Pre-fill update form when dialog opens
  React.useEffect(() => {
    if (ticket && showUpdateDialog) {
      setUpdateValue('status', ticket.status);
      setUpdateValue('priority', ticket.priority);
      setUpdateValue('assignedTo', ticket.assignedTo || '');
      setUpdateValue('category', ticket.category);
      setUpdateValue('tags', ticket.tags?.join(', ') || '');
    }
  }, [ticket, showUpdateDialog, setUpdateValue]);

  if (isError) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Ticket</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong while loading the ticket details.
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

  if (isLoading || !ticket) {
    return (
      <Card className="h-full">
        <CardHeader className="animate-pulse">
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const allMessages = messages || [];
  const publicMessages = allMessages.filter(m => !m.isInternal);
  const internalMessages = allMessages.filter(m => m.isInternal);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                <Badge variant="outline">#{ticket.id.slice(-8)}</Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{ticket.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{ticket.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="default" className="flex items-center gap-1">
                  {getStatusIcon(ticket.status)}
                  <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPriorityIcon(ticket.priority)}
                  <span className="capitalize">{ticket.priority}</span>
                </Badge>
                <Badge variant="secondary">{ticket.category}</Badge>
                {ticket.assignedTo && (
                  <Badge variant="outline">
                    Assigned to {ticket.assignedTo}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatusChange('in_progress')}
                  disabled={ticket.status === 'in_progress'}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickStatusChange('resolved')}
                  disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                >
                  Resolve
                </Button>
              </div>
              
              <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Ticket</DialogTitle>
                    <DialogDescription>
                      Update ticket status, priority, and other details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateSubmit(onUpdateTicket)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          defaultValue={ticket.status}
                          onValueChange={(value) => setUpdateValue('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="waiting_for_customer">Waiting for Customer</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                          defaultValue={ticket.priority}
                          onValueChange={(value) => setUpdateValue('priority', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        defaultValue={ticket.category}
                        onValueChange={(value) => setUpdateValue('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="account">Account</SelectItem>
                          <SelectItem value="feature_request">Feature Request</SelectItem>
                          <SelectItem value="bug_report">Bug Report</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowUpdateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmittingUpdate}>
                        {isSubmittingUpdate ? 'Updating...' : 'Update Ticket'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversation</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInternalNotes(!showInternalNotes)}
              >
                {showInternalNotes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-2">
                  {showInternalNotes ? 'Hide' : 'Show'} Internal Notes
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-[400px]">
            {/* Initial Description */}
            <div className="flex gap-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={ticket.user.avatar} />
                <AvatarFallback>
                  {ticket.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{ticket.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Public Messages */}
            {publicMessages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            
            {/* Internal Messages */}
            {showInternalNotes && internalMessages.map((message) => (
              <MessageItem key={message.id} message={message} isInternal />
            ))}
          </div>
          
          {/* Reply Form */}
          <form onSubmit={handleMessageSubmit(onSendMessage)} className="space-y-3">
            <Textarea
              {...registerMessage('content')}
              placeholder="Type your reply..."
              rows={3}
              className={messageErrors.content ? 'border-destructive' : ''}
            />
            {messageErrors.content && (
              <p className="text-sm text-destructive">{messageErrors.content.message}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...registerMessage('isInternal')}
                    className="rounded"
                  />
                  Internal note (not visible to customer)
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button type="submit" disabled={isSubmittingMessage}>
                  {isSubmittingMessage ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}