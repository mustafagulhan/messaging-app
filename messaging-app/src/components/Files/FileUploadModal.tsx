// FileUploadModal.tsx
import React, { useState, useRef } from 'react';
import { Folder } from '../../types';
import { FileText, X } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  currentFolder: Folder | null;
}

interface FilePreview {
  file: File;
  preview?: string;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpload,
  currentFolder 
}) => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createFilePreview = (file: File): FilePreview => {
    const preview = file.type.startsWith('image/') 
      ? URL.createObjectURL(file)
      : undefined;
    return { file, preview };
  };

  const handleFiles = (newFiles: File[]) => {
    const filePreviews = newFiles.map(createFilePreview);
    setFiles(prev => [...prev, ...filePreviews]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      await onUpload(files.map(f => f.file));
      // Upload sonrası kaynakları temizle
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Dosya yüklenirken bir hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Modal kapatılırken kaynakları temizle
  const handleClose = () => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {currentFolder ? `Dosya Yükle: ${currentFolder.name}` : 'Dosya Yükle'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-blue-500 hover:text-blue-600"
          >
            Dosyaları seçin veya buraya sürükleyin
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Seçilen dosyalar:</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    {file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <FileText size={24} className="text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" title={file.file.name}>
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isUploading}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || isUploading}
            className={`px-4 py-2 rounded ${
              files.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;