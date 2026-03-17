
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, XCircle, AlertTriangle, FileJson, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ApiClient } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

export default function ManifestValidatorPage() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [validating, setValidating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
    };
    reader.readAsText(selectedFile);
  };

  const handleValidate = async () => {
    if (!fileContent) return;
    setValidating(true);
    try {
      const response = await ApiClient.validateManifest(fileContent);
      
      if (response.success) {
        setResult(response.data);
        if (response.data.validation?.valid) {
          toast.success('Manifest is valid!');
        } else {
          toast.error('Manifest validation failed');
        }
      } else {
        toast.error(response.error || 'Validation failed');
      }
    } catch (error) {
      toast.error('Network error during validation');
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async () => {
    if (!fileContent || !currentUser) {
      toast.error('You must be logged in to register an integration');
      return;
    }
    
    setRegistering(true);
    try {
      const response = await ApiClient.registerIntegration(fileContent, currentUser.id);
      
      if (response.success) {
        toast.success('Integration registered successfully!');
      } else {
        toast.error(response.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('Network error during registration');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <Helmet>
        <title>Manifest Validator | Developer Portal</title>
      </Helmet>

      <div className="bg-card border-b border-border/50 pt-8 pb-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Manifest Validator
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your integration manifest (.ts, .js, or .json) to validate structure and register it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Actions */}
          <div className="lg:col-span-5 space-y-6">
            <Card 
              className={`p-8 border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center text-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/10 hover:bg-muted/20'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {file ? file.name : 'Upload Manifest File'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                Drag and drop your manifest file here, or click to browse.
              </p>
              <input 
                type="file" 
                id="manifest-upload" 
                className="hidden" 
                accept=".ts,.js,.json"
                onChange={handleFileChange}
              />
              <Button variant="outline" onClick={() => document.getElementById('manifest-upload').click()}>
                Select File
              </Button>
            </Card>

            {fileContent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                <Button 
                  className="w-full h-12 text-base" 
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? 'Validating...' : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> Validate Manifest
                    </>
                  )}
                </Button>
                
                {result?.validation?.valid && (
                  <Button 
                    variant="secondary"
                    className="w-full h-12 text-base bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50" 
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? 'Registering...' : (
                      <>
                        <Save className="w-4 h-4 mr-2" /> Register Integration
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {!result ? (
              <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center border-border/50 bg-card shadow-sm">
                <FileJson className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Results Yet</h3>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Upload and validate a manifest file to see the analysis here.
                </p>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                
                {/* Status Banner */}
                <Card className={`p-5 border-l-4 shadow-sm flex items-center gap-4 ${
                  result.validation?.valid 
                    ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10' 
                    : 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
                }`}>
                  {result.validation?.valid ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {result.validation?.valid ? 'Validation Passed' : 'Validation Failed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {result.validation?.valid 
                        ? 'The manifest structure is correct and ready for registration.' 
                        : 'Please fix the errors below before registering.'}
                    </p>
                  </div>
                </Card>

                {/* Parsed Details */}
                {result.parsed && (
                  <Card className="p-6 border-border/50 shadow-sm bg-card">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Manifest Details</h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="font-medium text-foreground">{result.parsed.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Version</p>
                        <Badge variant="outline" className="font-mono">{result.parsed.version || 'N/A'}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-medium text-foreground capitalize">{result.parsed.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Capabilities</p>
                        <p className="font-medium text-foreground">{result.parsed.capabilities?.length || 0} defined</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Errors */}
                {result.validation?.errors?.length > 0 && (
                  <Card className="border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-100 dark:border-red-900/50 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-red-800 dark:text-red-300 text-sm">Errors ({result.validation.errors.length})</h4>
                    </div>
                    <ul className="divide-y divide-border/50 bg-card">
                      {result.validation.errors.map((err, i) => (
                        <li key={i} className="px-4 py-3 text-sm text-foreground flex items-start gap-3">
                          <span className="text-red-500 mt-0.5">•</span> {err}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Warnings */}
                {result.validation?.warnings?.length > 0 && (
                  <Card className="border-amber-200 dark:border-amber-900/50 shadow-sm overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Warnings ({result.validation.warnings.length})</h4>
                    </div>
                    <ul className="divide-y divide-border/50 bg-card">
                      {result.validation.warnings.map((warn, i) => (
                        <li key={i} className="px-4 py-3 text-sm text-foreground flex items-start gap-3">
                          <span className="text-amber-500 mt-0.5">•</span> {warn}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
