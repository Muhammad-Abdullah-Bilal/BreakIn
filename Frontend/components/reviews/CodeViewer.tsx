'use client';

import React, { useState, useEffect } from 'react';
import { Submission, SubmissionFile } from '@/lib/types/domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Code, 
  FileText, 
  MessageSquare, 
  Plus, 
  Eye,
  Download,
  GitCommit,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  submission: Submission;
  onAddFeedback?: (lineNumber: number, comment: string) => void;
  className?: string;
}

export function CodeViewer({ submission, onAddFeedback, className }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<SubmissionFile | null>(null);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  // Auto-select first file
  useEffect(() => {
    if (submission.files.length > 0 && !selectedFile) {
      setSelectedFile(submission.files[0]);
    }
  }, [submission.files, selectedFile]);

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'zsh',
      'fish': 'fish',
    };
    return langMap[ext || ''] || 'text';
  };

  const handleLineClick = (lineNumber: number) => {
    if (selectedLines.includes(lineNumber)) {
      setSelectedLines(prev => prev.filter(l => l !== lineNumber));
    } else {
      setSelectedLines(prev => [...prev, lineNumber].sort((a, b) => a - b));
    }
  };

  const handleAddFeedback = () => {
    if (selectedLines.length === 0 || !feedbackComment.trim()) return;
    
    onAddFeedback?.(selectedLines[0], feedbackComment);
    setSelectedLines([]);
    setFeedbackComment('');
    setShowFeedbackDialog(false);
  };

  const codeViewerFileTypes = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust'];
  const codeFiles = submission.files.filter(file => 
    codeViewerFileTypes.some(type => file.type.includes(type)) ||
    file.filename.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt|scala)$/)
  );

  if (submission.type !== 'code' && codeFiles.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Code Files</h3>
          <p className="text-muted-foreground">
            This submission doesn't contain any code files to review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Repository Info */}
      {submission.repositoryUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Repository
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {submission.repositoryUrl.split('/').slice(-2).join('/')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {submission.repositoryUrl}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Repository
                </a>
              </Button>
            </div>

            {submission.commitHash && (
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">
                  {submission.commitHash.slice(0, 8)}
                </span>
                <Badge variant="outline" className="text-xs">
                  Latest Commit
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Browser and Code Viewer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Code Files
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
            {/* File List */}
            <div className="border-r bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-medium mb-3">
                Files ({codeFiles.length})
              </h4>
              
              {codeFiles.map((file) => (
                <Button
                  key={file.id}
                  variant={selectedFile?.id === file.id ? "default" : "ghost"}
                  className="w-full justify-start text-left h-auto p-3"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {file.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getLanguageFromExtension(file.filename)}
                        </Badge>
                        {file.size && (
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)}KB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}

              {codeFiles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No code files found
                </p>
              )}
            </div>

            {/* Code Display */}
            <div className="lg:col-span-3 flex flex-col">
              {selectedFile ? (
                <>
                  {/* File Header */}
                  <div className="border-b p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{selectedFile.filename}</span>
                        <Badge variant="outline">
                          {getLanguageFromExtension(selectedFile.filename)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {selectedLines.length > 0 && onAddFeedback && (
                          <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Feedback ({selectedLines.length} lines)
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Inline Feedback</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Selected lines: {selectedLines.join(', ')}
                                  </p>
                                </div>
                                
                                <Textarea
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Provide feedback for the selected lines..."
                                  rows={4}
                                />
                                
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleAddFeedback}
                                    disabled={!feedbackComment.trim()}
                                  >
                                    Add Feedback
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Code Content */}
                  <div className="flex-1 overflow-auto">
                    {selectedFile.content ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          language={getLanguageFromExtension(selectedFile.filename)}
                          style={vscDarkPlus}
                          showLineNumbers
                          wrapLines
                          lineNumberStyle={{ 
                            minWidth: '3em',
                            paddingRight: '1em',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                          lineProps={(lineNumber) => ({
                            style: {
                              backgroundColor: selectedLines.includes(lineNumber) 
                                ? 'rgba(59, 130, 246, 0.1)' 
                                : 'transparent',
                              borderLeft: selectedLines.includes(lineNumber)
                                ? '3px solid rgb(59, 130, 246)'
                                : '3px solid transparent',
                              cursor: 'pointer',
                            },
                            onClick: () => handleLineClick(lineNumber),
                          })}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '0.875rem',
                          }}
                        >
                          {selectedFile.content}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">File Preview Not Available</h3>
                        <p className="text-muted-foreground mb-4">
                          Unable to load file content for preview
                        </p>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a File</h3>
                    <p className="text-muted-foreground">
                      Choose a file from the list to view its contents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions for reviewers */}
      {onAddFeedback && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">How to add feedback</p>
                <p className="text-xs text-muted-foreground">
                  Click on line numbers to select lines, then click "Add Feedback" to provide inline comments.
                  Selected lines will be highlighted in blue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}