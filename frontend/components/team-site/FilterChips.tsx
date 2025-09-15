import React from 'react'
import { X } from 'lucide-react'

interface FilterChipsProps {
  items: string[]
  onRemove: (item: string) => void
  variant?: 'default' | 'small'
}

export const FilterChips: React.FC<FilterChipsProps> = ({ 
  items, 
  onRemove, 
  variant = 'default' 
}) => {
  if (items.length === 0) return null

  const chipClass = variant === 'small' 
    ? "inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 rounded-md text-xs"
    : "inline-flex items-center gap-1 px-3 py-1 bg-grey-accent-100 text-grey-accent-700 rounded-lg text-sm"

  const iconSize = variant === 'small' ? "w-3 h-3" : "w-4 h-4"

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className={chipClass}>
          {item}
          <button
            onClick={() => onRemove(item)}
            className="ml-1 hover:bg-grey-accent-200 rounded-full p-0.5"
          >
            <X className={iconSize} />
          </button>
        </span>
      ))}
    </div>
  )
}