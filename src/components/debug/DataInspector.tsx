'use client'

import React from 'react'

interface DataInspectorProps {
  title: string
  data: any
}

export function DataInspector({ title, data }: DataInspectorProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4 text-xs">
      <h3 className="font-bold text-gray-700 mb-2">{title}</h3>
      <div className="bg-white p-2 rounded border overflow-auto max-h-32">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
      <div className="mt-2 text-gray-600">
        Type: {typeof data} | Has data: {data ? 'Yes' : 'No'} | Keys: {data ? Object.keys(data || {}).length : 0}
      </div>
    </div>
  )
}