'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { contentService } from '@/lib/services/identity-api';
import { Article, ArticleFilters, ArticleCategory } from '@/lib/types/content';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { 
  Search,
  Filter,
  BookOpen,
  Clock,
  User,
  TrendingUp,
  Star,
  Eye,
  Calendar,
  Tag,
  ArrowRight,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Bookmark,
  Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';

interface ArticlesListProps {
  categoryId?: string;
  className?: string;
}

export function ArticlesList({ categoryId, className }: ArticlesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || '');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [difficulty, setDifficulty] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { ref: loadMoreRef, inView } = useInView();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['articleCategories'],
    queryFn: () => contentService.getCategories(),
  });

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ['articleTags', 'popular'],
    queryFn: () => contentService.getPopularTags(20),
  });

  // Build filters
  const filters: ArticleFilters = {
    search: debouncedSearch || undefined,
    categoryId: selectedCategory || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    difficulty: difficulty || undefined,
    sortBy: sortBy === 'latest' ? 'publishedAt' : 
            sortBy === 'popular' ? 'views' : 'engagement',
    sortOrder: 'desc',
  };

  // Fetch articles with infinite scroll
  const {
    data: articlesData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['articles', filters],
    queryFn: ({ pageParam = 1 }) => 
      contentService.searchArticles({ ...filters, page: pageParam, limit: 12 }),
    getNextPageParam: (lastPage) => 
      lastPage.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Auto-load more when scrolling
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allArticles = articlesData?.pages.flatMap(page => page.data) || [];

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setDifficulty('');
    setSelectedTags([]);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatReadTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min read`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m read`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-12 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, guides, and tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort */}
              <Tabs value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <TabsList>
                  <TabsTrigger value="latest" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Latest
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Difficulty Filter */}
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory || difficulty || selectedTags.length > 0) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Popular Tags */}
            {popularTags && popularTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Popular tags:</label>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 12).map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Active filters:</span>
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {allArticles.length === 0 ? 'No articles found' : 
           `${allArticles.length} article${allArticles.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Articles Grid/List */}
      {allArticles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearch 
                ? `No articles match "${debouncedSearch}"`
                : "Try adjusting your filters or search terms"}
            </p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {allArticles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4">
          {isFetchingNextPage && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading more articles...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && allArticles.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              You've reached the end of the results!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  viewMode: 'grid' | 'list';
}

function ArticleCard({ article, viewMode }: ArticleCardProps) {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatReadTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {article.featuredImage && (
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-24 h-16 object-cover rounded flex-shrink-0"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                      {article.difficulty}
                    </Badge>
                    <Badge variant="secondary">{article.category.name}</Badge>
                  </div>
                  
                  <Link href={`/knowledge-base/${article.slug}`}>
                    <h3 className="text-lg font-semibold hover:text-primary transition-colors mb-2">
                      {article.title}
                    </h3>
                  </Link>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={article.author.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {article.author.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{article.author.displayName}</span>
                    </div>
                    
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                    
                    <span>•</span>
                    <span>{formatReadTime(article.readingTime)}</span>
                    
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        {article.featuredImage && (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
              {article.difficulty}
            </Badge>
            <Badge variant="secondary">{article.category.name}</Badge>
          </div>
          
          <Link href={`/knowledge-base/${article.slug}`}>
            <h3 className="text-lg font-semibold hover:text-primary transition-colors mb-2 line-clamp-2">
              {article.title}
            </h3>
          </Link>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={article.author.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {article.author.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {article.author.displayName}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{article.views}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{formatReadTime(article.readingTime)}</span>
            </div>
            
            <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
          </div>
          
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button asChild variant="outline" size="sm">
              <Link href={`/knowledge-base/${article.slug}`}>
                Read More
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}