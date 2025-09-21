"use client"

import React, { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Clock, 
  Star,
  Mail,
  Phone,
  ExternalLink,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  codename: string
  position_applied: string
  job_id: string
  current_stage: string
  source: string
  match_score?: number
  skills: string[]
  experience_years?: number
  location?: string
  availability: string
  created_at: string
  updated_at: string
  last_activity?: string
  next_follow_up?: string
  avatar?: string
}

export interface KanbanColumn {
  id: string
  title: string
  candidates: Candidate[]
  color: string
  limit?: number
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCandidateMove: (candidateId: string, fromStage: string, toStage: string) => void
  onCandidateClick: (candidate: Candidate) => void
  onScheduleInterview?: (candidateId: string) => void
  onSendEmail?: (candidateId: string) => void
  className?: string
}

const stageColors = {
  sourced: 'bg-gray-100 border-gray-300',
  initial_contact: 'bg-blue-100 border-blue-300',
  screening: 'bg-yellow-100 border-yellow-300',
  technical_review: 'bg-orange-100 border-orange-300',
  interview_scheduled: 'bg-purple-100 border-purple-300',
  interview_completed: 'bg-indigo-100 border-indigo-300',
  reference_check: 'bg-pink-100 border-pink-300',
  offer_preparation: 'bg-cyan-100 border-cyan-300',
  offer_sent: 'bg-green-100 border-green-300',
  offer_negotiation: 'bg-amber-100 border-amber-300',
  offer_accepted: 'bg-emerald-100 border-emerald-300',
  hired: 'bg-green-200 border-green-400',
  rejected: 'bg-red-100 border-red-300',
  withdrawn: 'bg-gray-200 border-gray-400'
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'available':
      return 'bg-green-100 text-green-800'
    case '2_weeks_notice':
      return 'bg-yellow-100 text-yellow-800'
    case '1_month_notice':
      return 'bg-orange-100 text-orange-800'
    case 'not_available':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const CandidateCard: React.FC<{
  candidate: Candidate
  index: number
  onCandidateClick: (candidate: Candidate) => void
  onScheduleInterview?: (candidateId: string) => void
  onSendEmail?: (candidateId: string) => void
}> = ({ candidate, index, onCandidateClick, onScheduleInterview, onSendEmail }) => {
  return (
    <Draggable draggableId={candidate.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 transition-all duration-200",
            snapshot.isDragging && "rotate-2 scale-105"
          )}
        >
          <Card 
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              snapshot.isDragging && "shadow-lg"
            )}
            onClick={() => onCandidateClick(candidate)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {candidate.codename}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onCandidateClick(candidate)
                    }}>
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {onScheduleInterview && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onScheduleInterview(candidate.id)
                      }}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Interview
                      </DropdownMenuItem>
                    )}
                    {onSendEmail && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onSendEmail(candidate.id)
                      }}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      window.open(`mailto:${candidate.email}`)
                    }}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Email Direct
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground truncate">
                  {candidate.position_applied}
                </p>
                
                {candidate.match_score && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">
                      {Math.round(candidate.match_score * 100)}% match
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs px-1 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{candidate.skills.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {candidate.location && (
                      <>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-20">{candidate.location}</span>
                      </>
                    )}
                  </div>
                  {candidate.experience_years && (
                    <span>{candidate.experience_years}y exp</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getAvailabilityColor(candidate.availability))}
                  >
                    {candidate.availability.replace('_', ' ')}
                  </Badge>
                  {candidate.last_activity && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(candidate.last_activity)}</span>
                    </div>
                  )}
                </div>

                {candidate.next_follow_up && (
                  <div className="flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <Calendar className="h-3 w-3" />
                    <span>Follow up {formatDate(candidate.next_follow_up)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  )
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onCandidateMove,
  onCandidateClick,
  onScheduleInterview,
  onSendEmail,
  className
}) => {
  const [boardColumns, setBoardColumns] = useState(columns)

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = boardColumns.find(col => col.id === source.droppableId)
    const destColumn = boardColumns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const candidate = sourceColumn.candidates.find(c => c.id === draggableId)
    if (!candidate) return

    // Update local state
    const newColumns = boardColumns.map(column => {
      if (column.id === source.droppableId) {
        return {
          ...column,
          candidates: column.candidates.filter(c => c.id !== draggableId)
        }
      }
      if (column.id === destination.droppableId) {
        const newCandidates = [...column.candidates]
        newCandidates.splice(destination.index, 0, {
          ...candidate,
          current_stage: destination.droppableId
        })
        return {
          ...column,
          candidates: newCandidates
        }
      }
      return column
    })

    setBoardColumns(newColumns)

    // Notify parent component
    onCandidateMove(draggableId, source.droppableId, destination.droppableId)
  }, [boardColumns, onCandidateMove])

  // Update local state when props change
  React.useEffect(() => {
    setBoardColumns(columns)
  }, [columns])

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 h-full overflow-x-auto pb-4">
          {boardColumns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className="bg-gray-50 rounded-lg p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-sm">
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {column.candidates.length}
                      {column.limit && `/${column.limit}`}
                    </Badge>
                  </div>
                  {column.limit && column.candidates.length >= column.limit && (
                    <Badge variant="destructive" className="text-xs">
                      Full
                    </Badge>
                  )}
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto transition-colors duration-200",
                        snapshot.isDraggingOver && "bg-blue-50 rounded-md"
                      )}
                    >
                      {column.candidates.map((candidate, index) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          index={index}
                          onCandidateClick={onCandidateClick}
                          onScheduleInterview={onScheduleInterview}
                          onSendEmail={onSendEmail}
                        />
                      ))}
                      {provided.placeholder}
                      
                      {column.candidates.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          <div className="text-center">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No candidates</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default KanbanBoard