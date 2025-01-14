import React, { useState, useEffect } from 'react';
import { Image, FileText } from 'lucide-react';
import { FileItem } from '../../types';

const API_BASE_URL = 'http://localhost:8080';

interface FilePreviewProps {
  file: FileItem;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!file.type.startsWith('image/')) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/files/files/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Görüntü yüklenemedi');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Preview error:', error);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file.id, file.type]);

  if (file.type.startsWith('image/')) {
    return (
      <div className="w-full h-full">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-10 h-10 object-cover rounded"
            onError={(e) => {
              console.error('Image load error:', e);
              setPreviewUrl(null);
            }}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
            <FileText size={24} className="text-blue-500" />
          </div>
        )}
      </div>
    );
  }

  if (!file.type.startsWith('image/')) {
    return <FileText size={24} className="text-blue-500" />;
  }

  if (isLoading) {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 relative">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-10 h-10 object-cover rounded border border-gray-200"
          onError={(e) => {
            console.error('Image load error:', e);
            setPreviewUrl(null);
          }}
        />
      ) : (
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <Image size={24} className="text-blue-500" />
        </div>
      )}
    </div>
  );
};

export default FilePreview;