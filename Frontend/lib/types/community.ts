// Community and Forum Types
// Frozen contracts - PR required to change

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  type: 'text' | 'image' | 'link' | 'poll';
  imageUrls?: string[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  tags: Tag[];
  votes: Vote[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  type: 'question' | 'discussion' | 'announcement';
  tags: Tag[];
  votes: Vote[];
  replies: Reply[];
  viewCount: number;
  isLocked: boolean;
  isPinned: boolean;
  isSolved: boolean;
  solvedReplyId?: string;
  moderationFlags: ModerationFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface Reply {
  id: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  parentReplyId?: string;
  votes: Vote[];
  isSolution: boolean;
  isEdited: boolean;
  moderationFlags: ModerationFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  category: 'technology' | 'skill' | 'level' | 'topic' | 'special';
  usageCount: number;
  following?: boolean;
}

export interface Vote {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'thread' | 'reply';
  type: 'up' | 'down';
  createdAt: string;
}

export interface ModerationFlag {
  id: string;
  targetId: string;
  targetType: 'post' | 'thread' | 'reply' | 'user';
  flaggedById: string;
  flaggedByName: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedById?: string;
  reviewedByName?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

// Community Filters and Pagination
export interface PostFilters {
  search?: string;
  tags?: string[];
  type?: Post['type'][];
  authorId?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  timeframe?: '24h' | '7d' | '30d' | 'all';
}

export interface ThreadFilters {
  search?: string;
  tags?: string[];
  type?: Thread['type'][];
  status?: 'open' | 'solved' | 'locked';
  authorId?: string;
  sortBy?: 'recent' | 'popular' | 'activity' | 'unanswered';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Create/Update Forms
export interface CreatePostData {
  content: string;
  type: Post['type'];
  imageFiles?: File[];
  linkUrl?: string;
  tags: string[];
}

export interface CreateThreadData {
  title: string;
  content: string;
  type: Thread['type'];
  tags: string[];
}

export interface CreateReplyData {
  content: string;
  parentReplyId?: string;
}

export interface CreateModerationFlagData {
  targetId: string;
  targetType: ModerationFlag['targetType'];
  reason: ModerationFlag['reason'];
  description?: string;
}

// Vote Actions
export interface VoteAction {
  targetId: string;
  targetType: Vote['targetType'];
  type: Vote['type'] | 'remove';
}

// Realtime Events
export interface CommunityRealtimeEvent {
  type: 'post.created' | 'post.updated' | 'thread.created' | 'thread.updated' | 'reply.created' | 'vote.updated';
  data: Post | Thread | Reply | Vote;
  userId?: string;
}