// Sprint metrics types used by SprintMetrics component
export interface FeatureProgress {
  id: string
  name: string
  description?: string
  progress: number   // 0 to 1
  status: 'todo' | 'in_progress' | 'completed' | 'blocked'
  assignee?: string
  on_time?: boolean
  done?: number
  tasks?: number
}

export interface SprintMetrics {
  totalProgress: number
  completedFeatures: number
  totalFeatures: number
  blockedFeatures: number
  timeElapsedPercent: number
}

export function useSprintMetrics(features: FeatureProgress[]): SprintMetrics {
  const totalProgress = features.length > 0
    ? features.reduce((sum, f) => sum + f.progress, 0) / features.length
    : 0

  return {
    totalProgress: Math.round(totalProgress * 100),
    completedFeatures: features.filter(f => f.status === 'completed').length,
    totalFeatures: features.length,
    blockedFeatures: features.filter(f => f.status === 'blocked').length,
    timeElapsedPercent: 0,
  }
}
