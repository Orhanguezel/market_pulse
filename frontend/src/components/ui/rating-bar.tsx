'use client'

import { cn } from '@/integrations/shared'
import { Progress } from '@/components/ui/progress'

interface RatingBarProps {
  score: number
  maxScore?: number
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingBar({
  score,
  maxScore = 10,
  showScore = true,
  size = 'md',
  className
}: RatingBarProps) {
  const percentage = (score / maxScore) * 100

  const getColorClass = (score: number) => {
    if (score >= 8.5) return 'bg-green-600'
    if (score >= 7) return 'bg-green-500'
    if (score >= 4) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-2'
      case 'lg':
        return 'h-4'
      default:
        return 'h-3'
    }
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1">
        <Progress
          value={percentage}
          className={cn(getSizeClass(size), 'bg-bg-card-hover dark:bg-gray-700')}
        />
        <div
          className={cn(
            'absolute top-0 left-0 h-full transition-all duration-500',
            getSizeClass(size),
            getColorClass(score)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showScore && (
        <span className={cn(
          'font-semibold tabular-nums min-w-[3ch] text-right',
          {
            'text-sm': size === 'sm',
            'text-base': size === 'md',
            'text-lg': size === 'lg'
          }
        )}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface DetailedRatingProps {
  criteria: {
    performance: number
    stability: number
    coverage: number
    software: number
    price: number
  }
  weights?: {
    performance: number
    stability: number
    coverage: number
    software: number
    price: number
  }
  showWeights?: boolean
}

export function DetailedRating({
  criteria,
  weights = {
    performance: 0.35,
    stability: 0.25,
    coverage: 0.2,
    software: 0.1,
    price: 0.1
  },
  showWeights = false
}: DetailedRatingProps) {
  const criteriaLabels = {
    performance: 'Performans',
    stability: 'İstikrar & Ping',
    coverage: 'Kapsama & Çekim',
    software: 'Yazılım & Arayüz',
    price: 'Fiyat & Değer'
  }

  const calculateWeightedScore = () => {
    return Object.entries(criteria).reduce((total, [key, score]) => {
      return total + (score * weights[key as keyof typeof weights])
    }, 0)
  }

  const overallScore = calculateWeightedScore()

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-3xl font-bold mb-2">{overallScore.toFixed(1)}/10</div>
        <RatingBar score={overallScore} size="lg" showScore={false} />
      </div>

      <div className="space-y-3">
        {Object.entries(criteria).map(([key, score]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">{criteriaLabels[key as keyof typeof criteriaLabels]}</span>
              <div className="flex items-center gap-2">
                {showWeights && (
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(weights[key as keyof typeof weights] * 100)}%)
                  </span>
                )}
                <span className="font-semibold">{score.toFixed(1)}</span>
              </div>
            </div>
            <RatingBar score={score} showScore={false} size="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
