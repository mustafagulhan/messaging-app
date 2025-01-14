import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { FileItem } from '../../types';

const API_BASE_URL = 'http://localhost:8080';

interface FilePreviewProps {
  file: FileItem;
  isMessage?: boolean;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  isMessage = false, 
  className = '' 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      if (!file.type?.startsWith('image/')) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        let endpoint;
        if (isMessage) {
          // Mesaj dosyaları için message_files koleksiyonunu kullan
          endpoint = `/api/messages/files/${file.id}`;
        } else {
          // Normal dosyalar için fs koleksiyonunu kullan
          endpoint = `/api/files/files/${file.id}`;
        }

        console.log('Loading preview from:', endpoint); // Debug için

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Görüntü yüklenemedi');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setError(null);
      } catch (error) {
        console.error('Preview error:', error);
        setError('Önizleme yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file.id, file.type, isMessage]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[40px]">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        </div>
      );
    }

    if (error || !file.type?.startsWith('image/')) {
      return (
        <div className="flex items-center space-x-3 p-2 bg-gray-100 rounded">
          <div className="flex-shrink-0">
            <FileText size={40} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            {file.size && (
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>
      );
    }
    
    if (previewUrl) {
      return (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-[250px] h-[250px] object-contain rounded bg-gray-100"
          onError={(e) => {
            console.error('Image load error:', e);
            setError('Görüntü yüklenemedi');
            setPreviewUrl(null);
          }}
        />
      );
    }

    return null;
  };

  // Container sınıfları
  const containerClasses = className || 'w-[250px] h-[250px]';

  return (
    <div className={`relative ${containerClasses} overflow-hidden bg-white rounded-lg`}>
      {renderContent()}
    </div>
  );
};

export default FilePreview;