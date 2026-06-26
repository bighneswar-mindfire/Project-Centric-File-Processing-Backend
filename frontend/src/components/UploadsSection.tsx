import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { fileService, FileMetadata } from '../services/fileService';

interface UploadsSectionProps {
  projectId: string;
  onUploadSuccess: (newFiles: FileMetadata[]) => void;
  onError: (title: string, message: string) => void;
  onSuccess: (title: string, message: string) => void;
}

export const UploadsSection: React.FC<UploadsSectionProps> = ({
  projectId,
  onUploadSuccess,
  onError,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsLoadingUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  //byte calc
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  //file type check
  const validateAndAddFiles = (incomingFiles: File[]) => {
    const ALLOWED_TYPES = ['image/', 'application/pdf', 'text/', 'application/zip', 'video/'];
    const valid: File[] = [];
    const invalidNames: string[] = [];

    incomingFiles.forEach((file) => {
      if (ALLOWED_TYPES.some((type) => file.type.startsWith(type))) {
        valid.push(file);
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      onError(
        'Unsupported File Format',
        'Only images, PDFs, text files, ZIP archives, and videos are allowed.',
      );
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      validateAndAddFiles(selected);
    }
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  //file upload
  const handleUpload = async () => {
    if (!projectId || selectedFiles.length === 0) return;

    setIsLoadingUploading(true);
    setUploadProgress(0);

    try {
      const response = await fileService.uploadFiles(projectId, selectedFiles, (progress) => {
        setUploadProgress(progress);
      });

      onUploadSuccess(response.files);

      onSuccess(
        'Upload Successful',
        `${selectedFiles.length} file(s) have been successfully uploaded.`,
      );

      //reset selection
      setSelectedFiles([]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed.';
      onError('Upload Failed', errorMsg);
    } finally {
      setIsLoadingUploading(false);
    }
  };

  return (
    <div
      className={`grid grid-cols-1 ${selectedFiles.length > 0 ? 'md:grid-cols-2' : ''} gap-6 items-start`}
    >
      {/*drag drop area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 h-44 ${
          isDragging
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <UploadCloud className="h-8 w-8 text-slate-400" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-900">
            Drag & drop files here, or <span className="text-slate-600 underline">browse</span>
          </p>
          <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">
            Supports multiple file uploads
          </p>
        </div>
      </div>

      {/* selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white h-44 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col">
            <h4 className="text-xs font-semibold text-slate-900 mb-1">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 pr-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between py-1.5 text-[11px]">
                  <span
                    className="font-medium text-slate-700 truncate max-w-[140px]"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span>{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      className="text-red-500 hover:text-red-700 cursor-pointer font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* progress bar */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex-1 mr-3">
              {isUploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-auto h-8 text-[11px] px-3 shrink-0"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
