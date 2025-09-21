'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/lib/services/identity-api';
import { ArticleCategory } from '@/lib/types/content';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Folder,
  FolderOpen,
  Hash,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long'),
  parentId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: ArticleCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category ? {
      name: category.name,
      description: category.description,
      slug: category.slug,
      parentId: category.parentId || undefined,
      color: category.color || '#3b82f6',
      icon: category.icon || 'folder',
    } : {
      color: '#3b82f6',
      icon: 'folder',
    },
  });

  // Generate slug from name
  const watchedName = watch('name');
  React.useEffect(() => {
    if (watchedName && !category) {
      const slug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [watchedName, setValue, category]);

  // Fetch categories for parent selection
  const { data: categories } = useQuery({
    queryKey: ['articleCategories'],
    queryFn: () => contentService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => contentService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleCategories'] });
      toast({
        title: 'Category created',
        description: 'The category has been created successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating category',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormData) => contentService.updateCategory(category!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleCategories'] });
      toast({
        title: 'Category updated',
        description: 'The category has been updated successfully.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating category',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (category) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#eab308',
  ];

  const iconOptions = [
    'folder', 'file-text', 'book-open', 'code',
    'database', 'settings', 'users', 'star',
    'heart', 'bookmark', 'tag', 'target',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          {...register('name')}
          placeholder="Category name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description *</label>
        <Textarea
          {...register('description')}
          placeholder="Brief description of the category"
          rows={3}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Slug *</label>
        <Input
          {...register('slug')}
          placeholder="category-slug"
          className={errors.slug ? 'border-destructive' : ''}
        />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL-friendly identifier for this category
        </p>
      </div>

      {/* Parent Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Parent Category</label>
        <select
          {...register('parentId')}
          className="w-full p-3 border rounded-md bg-background"
        >
          <option value="">No parent (top-level category)</option>
          {categories?.filter(c => c.id !== category?.id).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Color */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue('color', color)}
                className={`w-8 h-8 rounded border-2 ${
                  watch('color') === color ? 'border-foreground' : 'border-muted'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Icon</label>
          <div className="grid grid-cols-4 gap-2">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('icon', icon)}
                className={`p-2 border rounded hover:bg-muted ${
                  watch('icon') === icon ? 'border-primary bg-primary/10' : 'border-muted'
                }`}
              >
                {icon === 'folder' && <Folder className="h-4 w-4 mx-auto" />}
                {icon === 'file-text' && <FileText className="h-4 w-4 mx-auto" />}
                {icon === 'book-open' && <FolderOpen className="h-4 w-4 mx-auto" />}
                {icon === 'tag' && <Hash className="h-4 w-4 mx-auto" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface CategoryCardProps {
  category: ArticleCategory;
  onEdit: (category: ArticleCategory) => void;
  onDelete: (category: ArticleCategory) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'folder':
        return <Folder className="h-5 w-5" />;
      case 'file-text':
        return <FileText className="h-5 w-5" />;
      case 'book-open':
        return <FolderOpen className="h-5 w-5" />;
      case 'tag':
        return <Hash className="h-5 w-5" />;
      default:
        return <Folder className="h-5 w-5" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {getIcon(category.icon || 'folder')}
              </div>
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(category)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{category.articleCount} articles</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>{category.totalViews} views</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {formatDistanceToNow(new Date(category.createdAt), { addSuffix: true })}</span>
            </div>
            
            {category.parentId && (
              <Badge variant="outline" className="text-xs">
                Subcategory
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/knowledge-base/category/${category.slug}`}>
                View Articles
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/content/categories/${category.id}/manage`}>
                Manage
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function CategoryManagement() {
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ArticleCategory | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['articleCategories'],
    queryFn: () => contentService.getCategories(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => contentService.deleteCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleCategories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully.',
      });
      setDeletingCategory(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting category',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (category: ArticleCategory) => {
    setEditingCategory(category);
  };

  const handleDelete = (category: ArticleCategory) => {
    setDeletingCategory(category);
  };

  const confirmDelete = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  const organizeCategories = (categories: ArticleCategory[]) => {
    const topLevel = categories.filter(cat => !cat.parentId);
    const withChildren = topLevel.map(parent => ({
      ...parent,
      children: categories.filter(cat => cat.parentId === parent.id),
    }));
    return withChildren;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-32" />
                      <div className="h-4 bg-muted rounded w-48" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Categories</h3>
          <p className="text-muted-foreground">
            Something went wrong while loading the categories.
          </p>
        </CardContent>
      </Card>
    );
  }

  const organizedCategories = categories ? organizeCategories(categories) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Categories</h1>
          <p className="text-muted-foreground">
            Organize your knowledge base content into categories
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your content.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSuccess={() => setShowCreateDialog(false)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {categories && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Total Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {categories.reduce((sum, cat) => sum + cat.articleCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {categories.reduce((sum, cat) => sum + cat.totalViews, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {organizedCategories.filter(cat => !cat.parentId).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Top Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Categories Grid */}
      {organizedCategories.length > 0 ? (
        <div className="space-y-8">
          {organizedCategories.map((category) => (
            <div key={category.id} className="space-y-4">
              {/* Parent Category */}
              <CategoryCard
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              
              {/* Child Categories */}
              {category.children && category.children.length > 0 && (
                <div className="ml-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.children.map((child) => (
                    <CategoryCard
                      key={child.id}
                      category={child}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Categories Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first category to start organizing content.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={() => setEditingCategory(null)}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? 
              This action cannot be undone and will affect {deletingCategory?.articleCount} articles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}