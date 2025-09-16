'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, FileText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { UserProfile } from "@/lib/types"

interface ResumeUploadProps {
  onProfileExtracted: (profile: UserProfile, organizedSkills?: any) => void
  onNext: () => void
  className?: string
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  file?: File
}

export function ResumeUpload({ onProfileExtracted, onNext, className }: ResumeUploadProps) {
  const [uploadState, setUploadState] = React.useState<UploadState>({
    status: 'idle',
    progress: 0
  })
  const [extractedProfile, setExtractedProfile] = React.useState<UserProfile | null>(null)

  const handleFileUpload = async (file: File) => {
    setUploadState({
      status: 'uploading',
      progress: 25,
      file
    })

    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUploadState(prev => ({
        ...prev,
        status: 'processing',
        progress: 50
      }))

      // Call API to extract profile from PDF
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to extract profile from resume')
      }

      const data = await response.json()
      
      setUploadState(prev => ({
        ...prev,
        progress: 100
      }))

      // Simulate processing completion
      await new Promise(resolve => setTimeout(resolve, 500))

      setExtractedProfile(data.profile)
      // Pass both profile and organized skills to parent
      onProfileExtracted(data.profile, data.organizedSkills)
      
      setUploadState(prev => ({
        ...prev,
        status: 'success'
      }))

    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to process resume'
      })
    }
  }

  const renderSuccessMessage = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center p-6"
    >
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Resume Processed Successfully!</h3>
      <p className="text-muted-foreground mb-4">
        We've extracted your profile information and structured it for optimization.
      </p>
      
      {extractedProfile && (
        <div className="w-full max-w-md space-y-2 text-left bg-muted/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-medium">{extractedProfile.personal_details?.name || 'Unknown'}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {(extractedProfile.experience || []).length} work experiences • {(extractedProfile.education || []).length} education entries
          </p>
          <p className="text-sm text-muted-foreground">
            {((extractedProfile.skills?.technology || []).length + (extractedProfile.skills?.soft_skills || []).length + (extractedProfile.skills?.design || []).length)} skills identified
          </p>
        </div>
      )}

      <Button onClick={onNext} size="lg">
        Continue to Resume Editor
      </Button>
    </motion.div>
  )

  const renderErrorMessage = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center p-6"
    >
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h3 className="text-xl font-semibold mb-2">Processing Failed</h3>
      <p className="text-muted-foreground mb-6">
        {uploadState.error || 'We encountered an error processing your resume. Please try again.'}
      </p>
      <Button 
        onClick={() => setUploadState({ status: 'idle', progress: 0 })}
        variant="outline"
      >
        Try Again
      </Button>
    </motion.div>
  )

  return (
    <div className={className}>
      {/* Hero Section */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-50 px-4 py-2 rounded-full border border-blue-100 mb-6"
        >
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-600">Step 1 of 5</span>
        </motion.div>
        
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-900 bg-clip-text text-transparent mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Transform Your Resume with AI
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Upload your existing resume and watch our advanced AI extract, analyze, and structure 
          your professional information for maximum impact.
        </motion.p>
      </motion.div>

      {/* Premium Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 pointer-events-none"></div>
          
          <CardContent className="relative p-8 md:p-12">
            {uploadState.status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-xl">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-green-400 rounded-full mx-auto animate-ping opacity-20"></div>
                </motion.div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-gray-900">✨ Resume Analyzed Successfully!</h3>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Our AI has intelligently extracted and structured your professional information. 
                    Ready to create something amazing!
                  </p>
                </div>

                {extractedProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 backdrop-blur rounded-2xl border border-gray-200/50 p-6 max-w-xl mx-auto shadow-lg"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{extractedProfile.personal_details?.name || 'Unknown'}</h4>
                        <p className="text-sm text-gray-500">Profile Successfully Extracted</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-blue-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-blue-600">{(extractedProfile.experience || []).length}</div>
                        <div className="text-xs text-blue-600">Experience</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-purple-600">{(extractedProfile.education || []).length}</div>
                        <div className="text-xs text-purple-600">Education</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {((extractedProfile.skills?.technology || []).length + (extractedProfile.skills?.soft_skills || []).length + (extractedProfile.skills?.design || []).length)}
                        </div>
                        <div className="text-xs text-green-600">Skills</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    onClick={onNext} 
                    size="lg"
                    className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Continue to Template Selection
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </Button>
                </motion.div>
              </motion.div>
            ) : uploadState.status === 'error' ? (
              renderErrorMessage()
            ) : (
              <div className="space-y-8">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  isUploading={uploadState.status === 'uploading' || uploadState.status === 'processing'}
                  error={uploadState.error}
                />

                {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5 }}
                    className="bg-white/60 backdrop-blur rounded-2xl border border-gray-200/50 p-6 space-y-6"
                  >
                    {/* AI Processing Animation */}
                    <div className="flex items-center justify-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                          />
                        </div>
                        <div className="absolute inset-0 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-lg text-gray-900">
                          {uploadState.status === 'uploading' ? '📤 Uploading Resume' : '🤖 AI Processing'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {uploadState.status === 'uploading' 
                            ? 'Securing your document...'
                            : 'Extracting and structuring your information...'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-gray-700">
                          {uploadState.status === 'uploading' ? 'Upload Progress' : 'AI Analysis Progress'}
                        </span>
                        <span className="text-blue-600">{uploadState.progress}%</span>
                      </div>
                      <div className="relative">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadState.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="absolute inset-0 h-3 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* Processing Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div className={`p-3 rounded-xl transition-all duration-500 ${
                        uploadState.progress >= 25 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="text-2xl mb-2">📄</div>
                        <div className="text-xs font-medium text-gray-600">Document Scan</div>
                      </div>
                      <div className={`p-3 rounded-xl transition-all duration-500 ${
                        uploadState.progress >= 75 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="text-2xl mb-2">🧠</div>
                        <div className="text-xs font-medium text-gray-600">AI Analysis</div>
                      </div>
                      <div className={`p-3 rounded-xl transition-all duration-500 ${
                        uploadState.progress >= 100 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className="text-2xl mb-2">✨</div>
                        <div className="text-xs font-medium text-gray-600">Structuring</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {uploadState.file && uploadState.status === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center bg-white/60 backdrop-blur rounded-xl border border-gray-200/50 p-4"
                  >
                    <p className="text-gray-600">
                      📎 <span className="font-medium">{uploadState.file.name}</span> ready to process
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-xl">🔒</span>
            </div>
            <h4 className="font-semibold text-gray-900">Secure & Private</h4>
            <p className="text-sm text-gray-600">Your data is encrypted and processed securely</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h4 className="font-semibold text-gray-900">Lightning Fast</h4>
            <p className="text-sm text-gray-600">AI-powered extraction in seconds</p>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h4 className="font-semibold text-gray-900">Highly Accurate</h4>
            <p className="text-sm text-gray-600">Advanced AI ensures precise data extraction</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}