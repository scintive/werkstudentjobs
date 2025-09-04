'use client'

import * as React from 'react'

interface EditModeContextValue {
  isEditMode: boolean
  setIsEditMode: (editMode: boolean) => void
}

const EditModeContext = React.createContext<EditModeContextValue | null>(null)

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = React.useState(false) // Start in preview mode

  const contextValue = React.useMemo(() => ({
    isEditMode,
    setIsEditMode
  }), [isEditMode])

  return (
    <EditModeContext.Provider value={contextValue}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode() {
  const context = React.useContext(EditModeContext)
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider')
  }
  return context
}