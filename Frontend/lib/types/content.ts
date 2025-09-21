// Content and Knowledge Base Types
// Frozen contracts - PR required to change

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string; // MDX content
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  category: ArticleCategory;
  tags: Tag[];
  status: 'draft' | 'published' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // minutes
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tableOfContents?: TableOfContentItem[];
  relatedArticles?: RelatedArticle[];
  featuredImageUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
  parentId?: string;
  articleCount: number;
}

export interface TableOfContentItem {
  id: string;
  title: string;
  level: number; // 1-6 for h1-h6
  anchor: string;
}

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  difficulty: Article['difficulty'];
  estimatedReadTime: number;
  authorName: string;
}

// Search and Filters
export interface ArticleFilters {
  search?: string;
  category?: string[];
  tags?: string[];
  difficulty?: Article['difficulty'][];
  author?: string;
  sortBy?: 'recent' | 'popular' | 'trending' | 'alphabetical';
  timeframe?: '24h' | '7d' | '30d' | 'all';
}

export interface SearchResult {
  type: 'article' | 'thread' | 'post';
  id: string;
  title: string;
  summary: string;
  url: string;
  relevanceScore: number;
  highlights?: string[];
  authorName?: string;
  createdAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  suggestions?: string[];
  filters: {
    types: Array<{ value: string; label: string; count: number }>;
    categories: Array<{ value: string; label: string; count: number }>;
    tags: Array<{ value: string; label: string; count: number }>;
  };
}

// Knowledge Base Navigation
export interface KnowledgeNavigation {
  categories: ArticleCategory[];
  popularTags: Tag[];
  featuredArticles: Article[];
  recentArticles: Article[];
}

// Article Interactions
export interface ArticleVote {
  articleId: string;
  type: 'like' | 'unlike';
}

export interface ArticleBookmark {
  articleId: string;
  action: 'add' | 'remove';
}

// Content Creation (for future admin/editor features)
export interface CreateArticleData {
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  tags: string[];
  difficulty: Article['difficulty'];
  featuredImageFile?: File;
  status: Article['status'];
}

export interface UpdateArticleData extends Partial<CreateArticleData> {
  id: string;
}

// MDX Component Props
export interface MDXComponentProps {
  content: string;
  components?: Record<string, React.ComponentType<any>>;
  className?: string;
}

// Article Reading Progress
export interface ReadingProgress {
  articleId: string;
  progress: number; // 0-100
  timeSpent: number; // seconds
  completed: boolean;
  lastReadAt: string;
}

// Content Analytics
export interface ArticleAnalytics {
  views: number;
  uniqueViews: number;
  averageTimeSpent: number;
  completionRate: number;
  likes: number;
  bookmarks: number;
  shares: number;
  topReferrers: Array<{ source: string; count: number }>;
  popularSections: Array<{ anchor: string; title: string; views: number }>;
}