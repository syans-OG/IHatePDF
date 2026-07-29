import React, { useRef, useState } from 'react';
import { UploadCloud, File, X, Plus } from 'lucide-react';
import { formatBytes } from '../services/pdfServices';

interface FileUploaderProps {
  accept: string;
  multiple: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  title?: string;
  subtitle?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  multiple,
  files,
  onFilesChange,
  title = 'Select PDF or Document Files',
  subtitle = 'or drag and drop files here',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (multiple) {
        onFilesChange([...files, ...droppedFiles]);
      } else {
        onFilesChange([droppedFiles[0]]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      if (multiple) {
        onFilesChange([...files, ...selectedFiles]);
      } else {
        onFilesChange([selectedFiles[0]]);
      }
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 border-2 border-dashed ${
          isDragging
            ? 'border-accent-red bg-accent-red/5 scale-[1.01]'
            : 'border-border-hover hover:border-text-muted bg-bg-card hover:bg-bg-surface'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-bg-surface border border-border-strong text-text-secondary flex items-center justify-center">
            <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
          </div>

          <div>
            <h4 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h4>
            <p className="text-[13px] text-text-muted mt-1">{subtitle}</p>
          </div>

          <button
            type="button"
            className="px-5 py-2 rounded-md text-[13px] font-medium text-bg-main bg-text-primary hover:bg-white transition-colors"
          >
            Select Files
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              Selected Files ({files.length})
            </span>
            {multiple && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-accent-red hover:text-[#ff4d5a] flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add More
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-strong"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 rounded-md bg-border-main text-text-secondary">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-[13px] font-medium text-text-primary truncate max-w-[180px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1.5 rounded-md text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
