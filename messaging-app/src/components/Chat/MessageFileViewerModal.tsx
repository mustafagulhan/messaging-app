// src/components/Chat/MessageFileViewerModal.tsx
import React, { useState, useEffect } from 'react';
import { X} from 'lucide-react';
const API_BASE_URL = 'http://localhost:8080';


const MessageFileViewerModal: React.FC<{ file: any; onClose: () => void }> = ({ file, onClose }) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const loadPreview = async () => {
          try {
              const token = localStorage.getItem('token');
              // Her zaman messages/files endpoint'ini kullan
              const response = await fetch(`${API_BASE_URL}/api/messages/files/${file.id}`, {
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              });
  
              if (!response.ok) throw new Error('Dosya yüklenemedi');
  
              const blob = await response.blob();
              setContent(URL.createObjectURL(blob));
          } catch (error) {
              setError('Dosya önizlemesi yüklenirken bir hata oluştu.');
          }
      };
  
      loadPreview();
      return () => {
          if (content) URL.revokeObjectURL(content);
      };
    }, [file.id]);
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{file.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="p-4">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : !content ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : (
              <img
                src={content}
                alt={file.name}
                style={{
                  maxHeight: '80vh',
                  maxWidth: '90vw',
                  width: 'auto',
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  export default MessageFileViewerModal;