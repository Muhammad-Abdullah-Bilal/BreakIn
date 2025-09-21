'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FeedbackService } from '@/lib/services/api';
import { FeedbackThread, FeedbackMessage } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Reply,
  CheckCircle,
  Clock,
  User,
  MessageCircle,
  Code,
  Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackPanelProps {
  submissionId: string;
  feedbackThreads: FeedbackThread[];
  onRefresh: () => void;
  className?: string;
}

export function FeedbackPanel({ 
  submissionId, 
  feedbackThreads, 
  onRefresh, 
  className 
}: FeedbackPanelProps) {
  const { user } = useAuth();
  const { subscribe } = useRealtime();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<FeedbackThread | null>(null);
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadContext, setNewThreadContext] = useState('');
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);

  // Create thread mutation
  const createThreadMutation = useMutation({
    mutationFn: (data: { content: string; context?: string; lineNumber?: number }) =>
      FeedbackService.createThread(submissionId, data.content, data.context, data.lineNumber),
    onSuccess: () => {
      onRefresh();
      setNewThreadContent('');
      setNewThreadContext('');
      setShowNewThreadDialog(false);
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      FeedbackService.addMessage(threadId, content),
    onSuccess: () => {
      onRefresh();
    },
  });

  // Resolve thread mutation
  const resolveThreadMutation = useMutation({
    mutationFn: FeedbackService.resolveThread,
    onSuccess: () => {
      onRefresh();
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!submissionId) return;

    const unsubscribe = subscribe(`feedback.${submissionId}`, (data: any) => {
      if (data.type === 'feedback.created' || data.type === 'feedback.updated' || data.type === 'feedback.resolved') {
        onRefresh();
      }
    });

    return () => unsubscribe();
  }, [submissionId, subscribe, onRefresh]);

  const handleCreateThread = () => {
    if (!newThreadContent.trim()) return;
    
    createThreadMutation.mutate({
      content: newThreadContent,
      context: newThreadContext || undefined,
    });
  };

  const handleResolveThread = (threadId: string) => {
    resolveThreadMutation.mutate(threadId);
  };

  const openThreads = feedbackThreads.filter(t => !t.resolved);
  const resolvedThreads = feedbackThreads.filter(t => t.resolved);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Feedback & Discussion</h3>
          <p className="text-sm text-muted-foreground">
            {openThreads.length} open, {resolvedThreads.length} resolved
          </p>
        </div>

        <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Feedback Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Context (optional)</label>
                <Textarea
                  value={newThreadContext}
                  onChange={(e) => setNewThreadContext(e.target.value)}
                  placeholder="e.g., 'Line 45 in main.py' or 'Overall code structure'"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  placeholder="Provide your feedback or ask a question..."
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateThread}
                  disabled={!newThreadContent.trim() || createThreadMutation.isPending}
                >
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feedback Threads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread List */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Open Threads ({openThreads.length})</h4>
            <div className="space-y-2">
              {openThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isSelected={selectedThread?.id === thread.id}
                  onClick={() => setSelectedThread(thread)}
                  onResolve={() => handleResolveThread(thread.id)}
                />
              ))}
              
              {openThreads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No open feedback threads</p>
                </div>
              )}
            </div>
          </div>

          {resolvedThreads.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Resolved ({resolvedThreads.length})</h4>
              <div className="space-y-2">
                {resolvedThreads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    isSelected={selectedThread?.id === thread.id}
                    onClick={() => setSelectedThread(thread)}
                    isResolved
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thread Detail */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <ThreadDetail 
              thread={selectedThread}
              onAddMessage={(content) => 
                addMessageMutation.mutate({ threadId: selectedThread.id, content })
              }
              onResolve={() => handleResolveThread(selectedThread.id)}
              isAddingMessage={addMessageMutation.isPending}
            />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Thread</h3>
                <p className="text-muted-foreground">
                  Choose a feedback thread to view the conversation
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThreadCardProps {
  thread: FeedbackThread;
  isSelected: boolean;
  onClick: () => void;
  onResolve?: () => void;
  isResolved?: boolean;
}

function ThreadCard({ thread, isSelected, onClick, onResolve, isResolved }: ThreadCardProps) {
  const lastMessage = thread.messages[thread.messages.length - 1];
  
  return (
    <Card 
      className={`cursor-pointer transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      } ${isResolved ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isResolved ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <MessageSquare className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm font-medium">
                Thread #{thread.id.slice(-6)}
              </span>
            </div>
            
            <Badge variant={isResolved ? "secondary" : "default"} className="text-xs">
              {thread.messages.length} messages
            </Badge>
          </div>

          {/* Context */}
          {thread.context && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {thread.lineNumber ? (
                <>
                  <Hash className="h-3 w-3" />
                  <span>Line {thread.lineNumber}</span>
                </>
              ) : (
                <>
                  <Code className="h-3 w-3" />
                  <span>{thread.context}</span>
                </>
              )}
            </div>
          )}

          {/* Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {thread.messages[0]?.content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{lastMessage.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Actions */}
          {!isResolved && onResolve && (
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve();
                }}
              >
                <CheckCircle className="h-3 w-3 mr-2" />
                Mark Resolved
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ThreadDetailProps {
  thread: FeedbackThread;
  onAddMessage: (content: string) => void;
  onResolve: () => void;
  isAddingMessage: boolean;
}

function ThreadDetail({ thread, onAddMessage, onResolve, isAddingMessage }: ThreadDetailProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onAddMessage(newMessage);
    setNewMessage('');
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Thread #{thread.id.slice(-6)}</CardTitle>
            {thread.context && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {thread.lineNumber ? (
                  <>
                    <Hash className="h-4 w-4" />
                    <span>Line {thread.lineNumber}</span>
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4" />
                    <span>{thread.context}</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {thread.resolved ? (
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolved
              </Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={onResolve}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {thread.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>

        {/* Reply Box */}
        {!thread.resolved && (
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Add to this thread..."
                rows={2}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isAddingMessage}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: FeedbackMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = message.authorId === user?.id;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-1 ${isOwn ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!isOwn && (
            <>
              <User className="h-3 w-3" />
              <span>{message.authorName}</span>
              <span>•</span>
            </>
          )}
          <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
        </div>
        
        <div className={`rounded-lg p-3 ${
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}