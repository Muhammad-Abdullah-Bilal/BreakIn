'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SprintService } from '@/lib/services/api';
import { Sprint, Task } from '@/lib/types/domain';
import { useAuth } from '@/providers/AuthProvider';
import { useRealtime } from '@/providers/RealtimeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  MoreHorizontal,
  CheckCircle,
  Circle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface SprintDetailProps {
  sprintId: string;
}

export function SprintDetail({ sprintId }: SprintDetailProps) {
  const { user } = useAuth();
  const { subscribe, publish } = useRealtime();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Fetch sprint details
  const {
    data: sprint,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => SprintService.get(sprintId),
    enabled: !!sprintId,
  });

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ['sprint', sprintId, 'tasks'],
    queryFn: () => SprintService.getTasks(sprintId),
    enabled: !!sprintId,
  });

  // Task mutations
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      SprintService.updateTask(sprintId, taskId, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(['sprint', sprintId, 'tasks'], (old: Task[] | undefined) =>
        old ? old.map(task => task.id === updatedTask.id ? updatedTask : task) : []
      );
      
      // Emit realtime update
      publish(`sprints.${sprintId}`, {
        type: 'sprints.updated',
        data: {
          sprintId,
          changes: { tasks: [updatedTask] },
          updatedBy: user?.id,
        },
      });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: (taskIds: string[]) => SprintService.reorderTasks(sprintId, taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint', sprintId, 'tasks'] });
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sprintId) return;

    const unsubscribe = subscribe(`sprints.${sprintId}`, (data: any) => {
      if (data.type === 'sprints.updated') {
        queryClient.invalidateQueries({ queryKey: ['sprint', sprintId] });
        queryClient.invalidateQueries({ queryKey: ['sprint', sprintId, 'tasks'] });
      }
    });

    return unsubscribe;
  }, [sprintId, subscribe, queryClient]);

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { 
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    const taskIds = updatedItems.map(item => item.id);

    queryClient.setQueryData(['sprint', sprintId, 'tasks'], updatedItems);
    reorderTasksMutation.mutate(taskIds);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Failed to load sprint details</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{sprint.title}</h1>
            <SprintStatusBadge status={sprint.status} />
          </div>
          <p className="text-muted-foreground mb-4">{sprint.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {formatDistanceToNow(new Date(sprint.createdAt), { addSuffix: true })}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {sprint.currentParticipants} participants
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {sprint.difficulty} level
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span>{sprint.progress.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all" 
                  style={{ width: `${sprint.progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {sprint.progress.completedTasks} of {sprint.progress.totalTasks} tasks completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Task Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Circle className="h-3 w-3 text-gray-400" />
                Todo
              </span>
              <span>{tasks.filter(t => t.status === 'todo').length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-3 w-3 text-blue-500" />
                In Progress
              </span>
              <span>{tasks.filter(t => t.status === 'in_progress').length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                Review
              </span>
              <span>{tasks.filter(t => t.status === 'review').length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Completed
              </span>
              <span>{tasks.filter(t => t.status === 'completed').length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {sprint.startDate && (
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <p>{format(new Date(sprint.startDate), 'MMM d, yyyy')}</p>
                </div>
              )}
              {sprint.endDate && (
                <div>
                  <span className="text-muted-foreground">Due:</span>
                  <p>{format(new Date(sprint.endDate), 'MMM d, yyyy')}</p>
                </div>
              )}
              {!sprint.startDate && !sprint.endDate && (
                <p className="text-muted-foreground">No timeline set</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'kanban')}>
                <TabsList>
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <AddTaskForm 
                    sprintId={sprintId}
                    onSuccess={() => {
                      setIsAddTaskOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['sprint', sprintId, 'tasks'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {tasksLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <TaskListView 
              tasks={tasks}
              onStatusChange={handleTaskStatusChange}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <TaskKanbanView 
              tasks={tasks}
              onStatusChange={handleTaskStatusChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      {sprint.progress.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sprint.progress.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${
                    milestone.status === 'completed' ? 'bg-green-500' :
                    milestone.status === 'in_progress' ? 'bg-blue-500' :
                    milestone.status === 'overdue' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={
                    milestone.status === 'completed' ? 'default' :
                    milestone.status === 'overdue' ? 'destructive' : 'secondary'
                  }>
                    {milestone.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function SprintStatusBadge({ status }: { status: Sprint['status'] }) {
  const variants = {
    active: 'default',
    completed: 'secondary',
    draft: 'outline',
    cancelled: 'destructive',
  } as const;

  return (
    <Badge variant={variants[status]}>
      {status}
    </Badge>
  );
}

// Placeholder components
function TaskListView({ 
  tasks, 
  onStatusChange, 
  onDragEnd 
}: { 
  tasks: Task[]; 
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onDragEnd: (result: DropResult) => void;
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="tasks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                      <TaskStatusSelector 
                        status={task.status}
                        onChange={(status) => onStatusChange(task.id, status)}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function TaskKanbanView({ 
  tasks, 
  onStatusChange 
}: { 
  tasks: Task[]; 
  onStatusChange: (taskId: string, status: Task['status']) => void;
}) {
  const columns = [
    { id: 'todo', title: 'Todo', status: 'todo' as const },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' as const },
    { id: 'review', title: 'Review', status: 'review' as const },
    { id: 'completed', title: 'Completed', status: 'completed' as const },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.id} className="space-y-3">
          <h3 className="font-medium text-sm">{column.title}</h3>
          <div className="space-y-2">
            {tasks
              .filter(task => task.status === column.status)
              .map((task) => (
                <div key={task.id} className="p-3 bg-card border rounded-lg">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                  <TaskStatusSelector 
                    status={task.status}
                    onChange={(status) => onStatusChange(task.id, status)}
                    size="sm"
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskStatusSelector({ 
  status, 
  onChange, 
  size = 'default' 
}: { 
  status: Task['status']; 
  onChange: (status: Task['status']) => void;
  size?: 'default' | 'sm';
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Task['status'])}
      className={`border rounded px-2 py-1 text-xs ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
    >
      <option value="todo">Todo</option>
      <option value="in_progress">In Progress</option>
      <option value="review">Review</option>
      <option value="completed">Completed</option>
    </select>
  );
}

function AddTaskForm({ 
  sprintId, 
  onSuccess 
}: { 
  sprintId: string; 
  onSuccess: () => void; 
}) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Add task form will be implemented here</p>
      <Button onClick={onSuccess} className="mt-4">
        Add Task (Mock)
      </Button>
    </div>
  );
}