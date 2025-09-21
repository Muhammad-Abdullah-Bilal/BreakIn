'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supportService } from '@/lib/services/identity-api';
import { FAQ, HelpArticle } from '@/lib/types/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
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
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Book,
  FileText,
  MessageSquare,
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  User,
  Settings,
  CreditCard,
  Shield,
  Smartphone,
  Globe,
  Mail,
  Phone,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Video,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateTicketDialog } from './CreateTicketForm';

interface HelpCenterProps {
  showCreateTicket?: boolean;
  defaultUserInfo?: {
    email?: string;
    name?: string;
  };
}

interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onToggle }) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer border-b">
          <div className="flex-1 text-left">
            <h4 className="font-medium">{faq.question}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {faq.category}
              </Badge>
              {faq.isPopular && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 bg-muted/20">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: faq.answer }}
          />
          {faq.relatedArticles && faq.relatedArticles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Related Articles:</p>
              <div className="space-y-1">
                {faq.relatedArticles.map((articleId) => (
                  <Button
                    key={articleId}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 justify-start"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    <span className="text-xs">Article #{articleId}</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(faq.updatedAt), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Was this helpful?</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface HelpArticleCardProps {
  article: HelpArticle;
}

const HelpArticleCard: React.FC<HelpArticleCardProps> = ({ article }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <Book className="h-4 w-4" />;
      case 'tutorial':
        return <Video className="h-4 w-4" />;
      case 'troubleshooting':
        return <Settings className="h-4 w-4" />;
      case 'getting_started':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getTypeIcon(article.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium line-clamp-2">{article.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {article.excerpt}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{article.readTime} min read</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>{article.rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function HelpCenter({ showCreateTicket = true, defaultUserInfo }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openFAQs, setOpenFAQs] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch FAQs
  const { data: faqs, isLoading: faqsLoading } = useQuery({
    queryKey: ['faqs', debouncedSearch, selectedCategory],
    queryFn: () => supportService.getFAQs({
      search: debouncedSearch || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
  });

  // Fetch help articles
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['helpArticles', debouncedSearch, selectedCategory],
    queryFn: () => supportService.getHelpArticles({
      search: debouncedSearch || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
  });

  const toggleFAQ = (faqId: string) => {
    setOpenFAQs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  const categories = [
    { value: 'all', label: 'All Topics', icon: <HelpCircle className="h-4 w-4" /> },
    { value: 'getting_started', label: 'Getting Started', icon: <Lightbulb className="h-4 w-4" /> },
    { value: 'account', label: 'Account & Profile', icon: <User className="h-4 w-4" /> },
    { value: 'billing', label: 'Billing & Payment', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'technical', label: 'Technical Issues', icon: <Settings className="h-4 w-4" /> },
    { value: 'security', label: 'Security & Privacy', icon: <Shield className="h-4 w-4" /> },
    { value: 'mobile', label: 'Mobile App', icon: <Smartphone className="h-4 w-4" /> },
    { value: 'integrations', label: 'Integrations', icon: <Globe className="h-4 w-4" /> },
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: <Mail className="h-5 w-5" />,
      action: 'contact',
    },
    {
      title: 'Live Chat',
      description: 'Chat with a support agent',
      icon: <MessageSquare className="h-5 w-5" />,
      action: 'chat',
    },
    {
      title: 'Schedule Call',
      description: 'Book a call with our team',
      icon: <Phone className="h-5 w-5" />,
      action: 'call',
    },
    {
      title: 'System Status',
      description: 'Check our service status',
      icon: <CheckCircle className="h-5 w-5" />,
      action: 'status',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">How can we help you?</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search our knowledge base, browse FAQs, or contact our support team for assistance.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 text-base"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.action} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {action.icon}
                </div>
                <h3 className="font-medium">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="flex-shrink-0"
            >
              {category.icon}
              <span className="ml-2">{category.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </TabsTrigger>
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Help Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-4">
          {faqsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : faqs && faqs.length > 0 ? (
            <Card>
              {faqs.map((faq, index) => (
                <FAQItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openFAQs.has(faq.id)}
                  onToggle={() => toggleFAQ(faq.id)}
                />
              ))}
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No FAQs match your search criteria.'
                    : 'No FAQs available at the moment.'
                  }
                </p>
                {showCreateTicket && (
                  <CreateTicketDialog defaultUserInfo={defaultUserInfo} />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          {articlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-muted rounded" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-full" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <HelpArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Book className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No articles match your search criteria.'
                    : 'No help articles available at the moment.'
                  }
                </p>
                {showCreateTicket && (
                  <CreateTicketDialog defaultUserInfo={defaultUserInfo} />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Still Need Help */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showCreateTicket && (
              <CreateTicketDialog 
                defaultUserInfo={defaultUserInfo}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Support Ticket
                  </Button>
                }
              />
            )}
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}