'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import './index.css'

interface FilterTag {
  id: string
  label: string
}

const filterTags: FilterTag[] = [
  { id: 'reciente', label: 'RECIENTE' },
  { id: 'popular', label: 'POPULAR' },
  { id: 'scroll', label: 'SCROLL' },
  { id: 'mouse', label: 'MOUSE' },
  { id: 'misc', label: 'MISC' },
  { id: '3d', label: '3D' },
  { id: 'menu', label: 'MENU' },
  { id: 'transition', label: 'TRANSITION' },
  { id: 'landing-page', label: 'LANDING PAGE' },
]

export default function FilterTags() {
  const [selectedTag, setSelectedTag] = useState('reciente')

  return (
    <div  className="w-full overflow-x-auto no-scrollbar lg:overflow-visible">
      <div className="flex gap-2 px-4 min-w-max justify-center lg:justify-center">
        {filterTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-normal transition-colors',
              selectedTag === tag.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  )
}
