'use client'

import * as React from "react"
import { Upload, FileText, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn, formatFileSize } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent } from "./card"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  acceptedTypes?: string[]
  maxSize?: number
  isUploading?: boolean
  error?: string | null
  className?: string
}

export function FileUpload({
  onFileUpload,
  acceptedTypes = ['.pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  isUploading = false,
  error = null,
  className
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }, [])

  const handleFileUpload = React.useCallback((file: File) => {
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      return
    }

    setSelectedFile(file)
    onFileUpload(file)
  }, [acceptedTypes, maxSize, onFileUpload])

  const handleRemoveFile = React.useCallback(() => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const onButtonClick = React.useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors",
            dragActive && "border-primary bg-primary/5",
            error && "border-destructive",
            isUploading && "pointer-events-none opacity-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            disabled={isUploading}
          />

          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <div className="animate-pulse">
                  <Upload className="w-10 h-10 text-primary mb-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Processing your resume...
                </p>
              </motion.div>
            ) : selectedFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center"
              >
                <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: any) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to change file or drag a new one
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center"
              >
                <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Upload your resume
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your PDF file here, or click to browse
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Supports: {acceptedTypes.join(', ')}</span>
                    <span>•</span>
                    <span>Max size: {formatFileSize(maxSize)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive mt-2 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            {error}
          </motion.p>
        )}
      </CardContent>
    </Card>
  )
}