'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import '../../blog/index.css'

interface FilterTag {
  id: string
  label: string
}

const filterTags: FilterTag[] = [
  { id: 'popular', label: 'POPULAR' },
  { id: 'general', label: 'GENERAL' },
  { id: 'cardiologia', label: 'CARDIOLOGÍA' },
  { id: 'pediatria', label: 'PEDIATRÍA' },
  { id: 'otorrino', label: 'OTORRINO' },
  { id: 'ginecologia', label: 'GINECOLOGÍA' },
  { id: 'odontologia', label: 'ODONTOLOGÍA' },
  { id: 'nutricion', label: 'NUTRICIÓN' },
]

export default function FilterTags() {
  const [selectedTag, setSelectedTag] = useState('popular')

  return (
    <div  className="w-full overflow-x-auto no-scrollbar lg:overflow-visible">
      <div className="flex px-4  gap-2 min-w-max justify-center lg:justify-center">
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
