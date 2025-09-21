'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supportService } from '@/lib/services/identity-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { 
  Send,
  Bot,
  User,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateTicketDialog } from './CreateTicketForm';

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
  helpfulLinks?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  quickActions?: Array<{
    label: string;
    action: string;
  }>;
}

interface ChatbotWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  defaultUserInfo?: {
    email?: string;
    name?: string;
  };
}

export function ChatbotWidget({ 
  isOpen, 
  onToggle, 
  onMinimize,
  isMinimized = false,
  defaultUserInfo 
}: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm your AI support assistant. I can help you find answers, guide you through our platform, or connect you with human support. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      suggestions: [
        "How do I reset my password?",
        "How do I update my profile?",
        "I'm having login issues",
        "How do billing and payments work?",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock chatbot response mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock responses based on message content
      const responses = getChatbotResponse(message);
      return responses;
    },
    onSuccess: (responses) => {
      setIsTyping(false);
      responses.forEach((response, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + index + '',
            ...response,
            timestamp: new Date(),
          }]);
        }, index * 500);
      });
    },
    onError: () => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + '',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team for assistance.",
        isBot: true,
        timestamp: new Date(),
        quickActions: [
          { label: "Create Support Ticket", action: "create_ticket" },
          { label: "Try Again", action: "retry" },
        ],
      }]);
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now() + '',
      content: inputValue,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    sendMessageMutation.mutate(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSendMessage();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create_ticket':
        // This would open the create ticket dialog
        break;
      case 'retry':
        if (messages.length > 1) {
          const lastUserMessage = messages[messages.length - 2];
          if (!lastUserMessage.isBot) {
            sendMessageMutation.mutate(lastUserMessage.content);
            setIsTyping(true);
          }
        }
        break;
      case 'human_support':
        setMessages(prev => [...prev, {
          id: Date.now() + '',
          content: "I'll connect you with a human support agent. Please describe your issue and we'll get you help right away.",
          isBot: true,
          timestamp: new Date(),
          quickActions: [
            { label: "Create Support Ticket", action: "create_ticket" },
          ],
        }]);
        break;
      default:
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen && !isMinimized) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          className="h-12 w-auto px-4 rounded-full shadow-lg"
          variant="default"
        >
          <Bot className="h-5 w-5 mr-2" />
          <span>AI Assistant</span>
          {messages.length > 1 && (
            <Badge variant="secondary" className="ml-2">
              {messages.length - 1}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">AI Assistant</CardTitle>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onMinimize && (
              <Button variant="ghost" size="sm" onClick={onMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}>
                <Avatar className="w-7 h-7 flex-shrink-0">
                  {message.isBot ? (
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className={`max-w-[80%] ${message.isBot ? '' : 'flex flex-col items-end'}`}>
                  <div className={`rounded-lg p-3 text-sm ${
                    message.isBot 
                      ? 'bg-muted' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Suggested questions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto p-2 text-left justify-start text-xs"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Helpful Links */}
              {message.helpfulLinks && message.helpfulLinks.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Helpful resources:</p>
                  <div className="space-y-1">
                    {message.helpfulLinks.map((link, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-2 justify-start text-xs w-full"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{link.title}</div>
                          {link.description && (
                            <div className="text-muted-foreground">{link.description}</div>
                          )}
                        </div>
                        <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              {message.quickActions && message.quickActions.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {message.quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-7 h-7">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Powered by AI • May produce inaccurate information</span>
            <CreateTicketDialog 
              defaultUserInfo={defaultUserInfo}
              trigger={
                <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
                  Need human help?
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock chatbot response generator
function getChatbotResponse(message: string): Partial<ChatMessage>[] {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
    return [{
      content: "I can help you reset your password! Here's how to do it:\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link to create a new password\n\nIf you're still having trouble, I can connect you with our support team.",
      isBot: true,
      helpfulLinks: [
        {
          title: "Password Reset Guide",
          url: "/help/password-reset",
          description: "Step-by-step instructions"
        }
      ],
      quickActions: [
        { label: "Reset Password Now", action: "reset_password" },
        { label: "Contact Support", action: "human_support" },
      ],
    }];
  }
  
  if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
    return [{
      content: "I can help with login issues! Here are some common solutions:\n\n• Make sure you're using the correct email address\n• Check if Caps Lock is on\n• Try resetting your password\n• Clear your browser cache\n• Disable browser extensions\n\nWhich of these would you like to try first?",
      isBot: true,
      suggestions: [
        "How do I reset my password?",
        "How do I clear browser cache?",
        "I'm using the right credentials but can't login",
        "Contact human support",
      ],
    }];
  }
  
  if (lowerMessage.includes('profile') || lowerMessage.includes('account')) {
    return [{
      content: "I can help you manage your profile and account settings! Here are some common tasks:\n\n• Update personal information\n• Change profile picture\n• Manage privacy settings\n• Update notification preferences\n• Change password or email\n\nWhat specifically would you like to do with your profile?",
      isBot: true,
      helpfulLinks: [
        {
          title: "Profile Management Guide",
          url: "/help/profile-settings",
          description: "Complete guide to profile settings"
        }
      ],
      suggestions: [
        "How do I change my profile picture?",
        "How do I update my personal information?",
        "How do I manage privacy settings?",
        "How do I change my email address?",
      ],
    }];
  }
  
  if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || lowerMessage.includes('subscription')) {
    return [{
      content: "I can help with billing and payment questions! Here's what I can assist with:\n\n• View your current subscription\n• Update payment methods\n• Download invoices\n• Cancel or upgrade subscription\n• Billing cycle information\n\nFor specific billing issues or disputes, I recommend contacting our billing support team directly.",
      isBot: true,
      helpfulLinks: [
        {
          title: "Billing FAQ",
          url: "/help/billing",
          description: "Common billing questions"
        },
        {
          title: "Subscription Plans",
          url: "/pricing",
          description: "View available plans"
        }
      ],
      quickActions: [
        { label: "View Billing", action: "view_billing" },
        { label: "Contact Billing Support", action: "billing_support" },
      ],
    }];
  }
  
  if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
    return [{
      content: "I'm sorry you're experiencing an issue! To help you better, could you please provide more details:\n\n• What exactly happened?\n• When did it start?\n• What browser/device are you using?\n• Any error messages you saw?\n\nThe more details you provide, the better I can assist you!",
      isBot: true,
      quickActions: [
        { label: "Report a Bug", action: "create_ticket" },
        { label: "Check System Status", action: "system_status" },
        { label: "Contact Technical Support", action: "human_support" },
      ],
    }];
  }
  
  if (lowerMessage.includes('human') || lowerMessage.includes('agent') || lowerMessage.includes('support')) {
    return [{
      content: "I'd be happy to connect you with a human support agent! You can:\n\n• Create a support ticket for non-urgent issues\n• Start a live chat for immediate assistance\n• Schedule a call with our team\n\nWhich option works best for you?",
      isBot: true,
      quickActions: [
        { label: "Create Support Ticket", action: "create_ticket" },
        { label: "Start Live Chat", action: "live_chat" },
        { label: "Schedule Call", action: "schedule_call" },
      ],
    }];
  }
  
  // Default response
  return [{
    content: "I understand you need help, but I'm not sure about the specific details of your question. Let me offer some options:\n\n• Browse our help articles\n• Search our FAQ\n• Contact our support team\n\nOr you can try asking your question in a different way, and I'll do my best to help!",
    isBot: true,
    suggestions: [
      "How do I reset my password?",
      "How do I update my profile?",
      "I'm having technical issues",
      "I have a billing question",
    ],
    quickActions: [
      { label: "Browse Help Articles", action: "help_articles" },
      { label: "Contact Support", action: "human_support" },
    ],
  }];
}

// Main chatbot component that can be embedded anywhere
export function SupportChatbot({ defaultUserInfo }: { defaultUserInfo?: { email?: string; name?: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <ChatbotWidget
      isOpen={isOpen}
      onToggle={handleToggle}
      onMinimize={handleMinimize}
      isMinimized={isMinimized}
      defaultUserInfo={defaultUserInfo}
    />
  );
}