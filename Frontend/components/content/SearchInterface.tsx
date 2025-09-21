'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '@/lib/services/identity-api';
import { SearchResult, SearchFilters, ArticleCategory } from '@/lib/types/content';
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
  Clock,
  Eye,
  User,
  BookOpen,
  FileText,
  Hash,
  TrendingUp,
  Calendar,
  ArrowRight,
  X,
  Zap,
  Star,
  Target
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchInterfaceProps {
  initialQuery?: string;
  className?: string;
}

interface SearchResultItemProps {
  result: SearchResult;
  searchQuery: string;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, searchQuery }) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'tutorial':
        return <BookOpen className="h-4 w-4" />;
      case 'guide':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <Link href={`/knowledge-base/${result.slug}`}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(result.type)}
                  <Badge variant="outline" className={getDifficultyColor(result.difficulty)}>
                    {result.difficulty}
                  </Badge>
                  <Badge variant="secondary">{result.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3" />
                    <span>{result.score?.toFixed(1)}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold hover:text-primary transition-colors mb-2">
                  {highlightText(result.title, searchQuery)}
                </h3>
                
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {highlightText(result.excerpt, searchQuery)}
                </p>
              </div>
              
              {result.featuredImage && (
                <img
                  src={result.featuredImage}
                  alt={result.title}
                  className="w-20 h-16 object-cover rounded flex-shrink-0"
                />
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={result.author.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {result.author.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{result.author.displayName}</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(result.publishedAt), { addSuffix: true })}</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{result.readingTime} min</span>
              </div>
              
              <span>•</span>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{result.views}</span>
              </div>
            </div>

            {/* Tags */}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {highlightText(tag, searchQuery)}
                  </Badge>
                ))}
                {result.tags.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{result.tags.length - 5}
                  </Badge>
                )}
              </div>
            )}

            {/* Match Context */}
            {result.matchContext && (
              <div className="p-3 bg-muted/50 rounded border-l-4 border-primary">
                <p className="text-sm">
                  {highlightText(result.matchContext, searchQuery)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export function SearchInterface({ initialQuery = '', className }: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>('relevance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const router = useRouter();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['articleCategories'],
    queryFn: () => contentService.getCategories(),
  });

  // Fetch popular tags for suggestions
  const { data: popularTags } = useQuery({
    queryKey: ['searchTags'],
    queryFn: () => contentService.getPopularTags(20),
    enabled: searchQuery.length === 0, // Only show when not searching
  });

  // Build search filters
  const filters: SearchFilters = {
    query: debouncedSearch,
    categoryId: selectedCategory || undefined,
    difficulty: selectedDifficulty || undefined,
    type: selectedType || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    sortBy,
  };

  // Perform search
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['contentSearch', filters],
    queryFn: () => contentService.search(filters),
    enabled: debouncedSearch.length > 0 || selectedCategory !== '' || selectedTags.length > 0,
  });

  // Get trending searches
  const { data: trendingSearches } = useQuery({
    queryKey: ['trendingSearches'],
    queryFn: () => contentService.getTrendingSearches(),
    enabled: searchQuery.length === 0,
  });

  // Get recent articles (when no search)
  const { data: recentArticles } = useQuery({
    queryKey: ['recentArticles'],
    queryFn: () => contentService.getRecent(8),
    enabled: searchQuery.length === 0 && selectedCategory === '' && selectedTags.length === 0,
  });

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

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
    setSelectedDifficulty('');
    setSelectedType('');
    setSelectedTags([]);
  };

  const hasActiveFilters = selectedCategory || selectedDifficulty || selectedType || selectedTags.length > 0;
  const hasSearchQuery = debouncedSearch.length > 0;
  const showResults = hasSearchQuery || hasActiveFilters;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Search Knowledge Base</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find articles, tutorials, guides, and resources to help you learn and grow.
        </p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for articles, tutorials, concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 text-lg h-14"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Tabs value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <TabsList>
                  <TabsTrigger value="relevance">Relevance</TabsTrigger>
                  <TabsTrigger value="date">Latest</TabsTrigger>
                  <TabsTrigger value="popularity">Popular</TabsTrigger>
                </TabsList>
              </Tabs>

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

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
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

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="article">Articles</SelectItem>
                  <SelectItem value="tutorial">Tutorials</SelectItem>
                  <SelectItem value="guide">Guides</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Active tags:</span>
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {showResults && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              {isLoading ? (
                <div className="h-6 bg-muted rounded w-48 animate-pulse" />
              ) : searchResults ? (
                <p className="text-muted-foreground">
                  {searchResults.totalResults === 0 
                    ? 'No results found'
                    : `${searchResults.totalResults} result${searchResults.totalResults !== 1 ? 's' : ''} found`
                  }
                  {hasSearchQuery && ` for "${debouncedSearch}"`}
                </p>
              ) : null}
            </div>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-20" />
                        <div className="h-6 bg-muted rounded w-24" />
                      </div>
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-16 bg-muted rounded" />
                      <div className="flex gap-2">
                        <div className="h-4 bg-muted rounded w-16" />
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
                <p className="text-muted-foreground">
                  {error?.message || 'Something went wrong while searching.'}
                </p>
              </CardContent>
            </Card>
          ) : searchResults && searchResults.results.length > 0 ? (
            <div className="space-y-4">
              {searchResults.results.map((result) => (
                <SearchResultItem 
                  key={result.id} 
                  result={result} 
                  searchQuery={debouncedSearch}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters.
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Default Content (when not searching) */}
      {!showResults && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trending Searches */}
          {trendingSearches && trendingSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Searches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {trendingSearches.map((search, index) => (
                  <button
                    key={search}
                    onClick={() => setSearchQuery(search)}
                    className="block w-full text-left p-2 hover:bg-muted rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm">{search}</span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Popular Tags */}
          {popularTags && popularTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Popular Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/knowledge-base/category/getting-started">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Getting Started Guide
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/knowledge-base/category/tutorials">
                  <FileText className="h-4 w-4 mr-2" />
                  Latest Tutorials
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link href="/knowledge-base/category/best-practices">
                  <Target className="h-4 w-4 mr-2" />
                  Best Practices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Articles (when not searching) */}
      {!showResults && recentArticles && recentArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Articles</h2>
            <Button asChild variant="outline">
              <Link href="/knowledge-base">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <Link href={`/knowledge-base/${article.slug}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {article.difficulty}
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{article.readingTime} min</span>
                        <span>•</span>
                        <Eye className="h-3 w-3" />
                        <span>{article.views}</span>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}