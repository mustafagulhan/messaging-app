// src/components/Files/FileManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FileItem, Folder } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { FileText, Image, Download, X, FolderIcon, Trash2, Plus } from 'lucide-react';
import FileUploadModal from './FileUploadModal';
import FileViewerModal from '../Chat/FileViewerModal';

const API_BASE_URL = 'http://localhost:8080';

interface PreviewModalProps {
  file: FileItem;
  onClose: () => void;
}

interface FolderTreeItemProps {
  folder: Folder;
  level: number;
  selectedFolder: Folder | null;
  onSelect: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onCreateSubfolder: (parentId: string) => void;
}

// PreviewModal component
const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/files/preview/${file.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Dosya yüklenemedi');

        const blob = await response.blob();

        if (file.type.startsWith('image/')) {
          setContent(URL.createObjectURL(blob));
        } else if (file.type === 'application/pdf') {
          setContent(URL.createObjectURL(blob));
        } else if (file.type.includes('text') || file.type.includes('javascript') || file.type.includes('json')) {
          const text = await blob.text();
          setContent(text);
        } else {
          setError('Bu dosya türü için önizleme desteklenmiyor.');
        }
      } catch (error) {
        setError('Dosya önizlemesi yüklenirken bir hata oluştu.');
      }
    };

    loadPreview();
  }, [file]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">{file.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : !content ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : file.type.startsWith('image/') ? (
            <img src={content} alt={file.name} className="max-w-full h-auto" />
          ) : file.type === 'application/pdf' ? (
            <iframe src={content} className="w-full h-[70vh]" title={file.name} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

// FolderTreeItem component
const FolderTreeItem: React.FC<FolderTreeItemProps> = ({
  folder,
  level,
  selectedFolder,
  onSelect,
  onDelete,
  onCreateSubfolder
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`"${folder.name}" klasörünü silmek istediğinizden emin misiniz?`)) {
      onDelete(folder);
    }
  };

  return (
    <div className="relative">
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"
          style={{ left: `${(level - 1) * 20 + 8}px` }}
        />
      )}
      
      <div className="flex items-center py-1" style={{ paddingLeft: `${level * 20}px` }}>
        {level > 0 && (
          <div 
            className="absolute w-4 h-px bg-gray-200" 
            style={{ left: `${(level - 1) * 20 + 8}px` }}
          />
        )}
        
        <button
          onClick={() => onSelect(folder)}
          className={`flex items-center space-x-2 hover:bg-gray-100 rounded px-2 py-1 w-full ${
            selectedFolder?.id === folder.id ? 'bg-blue-50 text-blue-600' : ''
          }`}
        >
          <FolderIcon size={18} className="text-blue-500" />
          <span className="truncate flex-1" title={folder.name}>{folder.name}</span>
        </button>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(folder.id);
            }}
            className="p-1 hover:bg-blue-50 rounded"
            title="Alt klasör oluştur"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded text-red-600"
            title="Klasörü sil"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {Array.isArray(folder.subFolders) && folder.subFolders.length > 0 && (
        <div className="relative">
          {folder.subFolders.map(subfolder => (
            <FolderTreeItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              selectedFolder={selectedFolder}
              onSelect={onSelect}
              onDelete={onDelete}
              onCreateSubfolder={onCreateSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
// FileManager component
const FileManager: React.FC = () => {
  const { user } = useAuth();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileDownload = async (file: FileItem) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Dosya indirilemedi');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Dosya indirilemedi');
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    if (!window.confirm(`"${file.name}" dosyasını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Dosya silinemedi');
      await fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Dosya silinirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderDelete = async (folder: Folder) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/folders/${folder.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Klasör silinemedi');
      if (currentFolder?.id === folder.id) {
        setCurrentFolder(null);
      }
      await fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Klasör silinirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const url = currentFolder
        ? `${API_BASE_URL}/api/files/list?folder_id=${currentFolder.id}`
        : `${API_BASE_URL}/api/files/list`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Dosyalar yüklenemedi');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('Dosyalar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [currentFolder, user?.id]);

  const buildFolderTree = useCallback((folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder>();
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, subFolders: [] });
    });

    const rootFolders: Folder[] = [];
    folderMap.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent && Array.isArray(parent.subFolders)) {
          parent.subFolders.push(folder);
        }
      } else {
        rootFolders.push(folder);
      }
    });

    return rootFolders;
  }, []);

  const fetchFolders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/folders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Klasörler yüklenemedi');
      const data = await response.json();
      const folderTree = buildFolderTree(data);
      setFolders(folderTree);
    } catch (error) {
      console.error('Error fetching folders:', error);
      alert('Klasörler yüklenirken bir hata oluştu');
    }
  }, [user?.id, buildFolderTree]);

  const handleFileUpload = async (files: File[]) => {
    if (!currentFolder) {
      alert('Lütfen önce bir klasör seçin');
      return;
    }
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
  
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) {
          formData.append('folder_id', currentFolder.id);
        }
  
        // Content-Type header'ı kaldırıldı - otomatik olarak ayarlanacak
        const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type otomatik olarak browser tarafından ayarlanacak
          },
          body: formData
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || 'Dosya yüklenemedi');
        }
      }
  
      await fetchFiles();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(error instanceof Error ? error.message : 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const FileImagePreview: React.FC<{ file: FileItem }> = ({ file }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    
    useEffect(() => {
      const loadImage = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/files/files/${file.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) throw new Error('Failed to load image');
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImgSrc(url);
        } catch (error) {
          console.error('Error loading image:', error);
        }
      };
  
      loadImage();
  
      return () => {
        if (imgSrc) URL.revokeObjectURL(imgSrc);
      };
    }, [file.id]);
  
    if (!imgSrc) {
      return <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Image size={24} className="text-blue-500" />
      </div>;
    }
  
    return (
      <img
        src={imgSrc}
        alt={file.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('Image load error:', e);
          e.currentTarget.parentElement?.classList.add('bg-gray-100');
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  };

  const handleCreateSubfolder = async (parentId: string) => {
    const folderName = window.prompt('Alt klasör adını girin:');
    if (!folderName?.trim()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/folders/${parentId}/subfolders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: folderName.trim() })
      });

      if (!response.ok) {
        throw new Error('Alt klasör oluşturulamadı');
      }

      const data = await response.json();
      if (!isCreateFolderResponse(data)) {
        throw new Error('Geçersiz sunucu yanıtı');
      }

      await fetchFolders();
    } catch (error) {
      console.error('Error creating subfolder:', error);
      alert('Alt klasör oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt('Klasör adını girin:');
    if (!folderName?.trim()) return;
  
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: folderName.trim() })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Klasör oluşturulamadı');
      }
      
      // Başarılı olursa klasör listesini yenile
      await fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(error instanceof Error ? error.message : 'Klasör oluşturulurken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // FileManager component'ine eklenecek yeni state
  const [isDragging, setIsDragging] = useState(false);

  // Mevcut handleDrop ve handleDragOver fonksiyonlarının yerine aşağıdakileri kullanın
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      resetDragState();
      
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleFileUpload(droppedFiles);
      }
    },
    [currentFolder]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Fare gerçekten drop alanından çıktı mı kontrol et
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x < rect.left ||
      x >= rect.right ||
      y < rect.top ||
      y >= rect.bottom
    ) {
      resetDragState();
    }
  };

  const resetDragState = () => {
    setIsDragging(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    // Mouse pencereden çıktığında veya bırakıldığında drag state'ini sıfırla
    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <div className="h-full flex">
      {/* Sol Sidebar */}
      <div className="w-80 border-r bg-white p-4">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-700">Dosyalarım</h2>
        </div>
        <div className="space-y-2">
          {folders.map(folder => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              level={0}
              selectedFolder={currentFolder}
              onSelect={setCurrentFolder}
              onDelete={handleFolderDelete}
              onCreateSubfolder={handleCreateSubfolder}
            />
          ))}
        </div>
      </div>
  
      {/* Ana İçerik */}
      <div className="flex-1 bg-gray-50">
        {/* Üst Toolbar */}
        <div className="bg-white border-b p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <Plus size={18} className="mr-2" />
                 Dosya Yükle
              </button>
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center"
              >
                <FolderIcon size={18} className="mr-2" />
                 Yeni Klasör
              </button>
            </div>
            {currentFolder && (
              <div className="text-gray-700 flex items-center">
                <FolderIcon size={18} className="mr-2" />
                  <span className="truncate max-w-[200px]" title={currentFolder.name}>
                    {currentFolder.name}
                  </span>
                </div>
            )}
          </div>
        </div>
        {!currentFolder ? (
          // Boş başlangıç sayfası
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <FolderIcon size={48} className="mb-4 text-gray-400" />
            <p className="text-lg mb-2">Henüz bir klasör seçilmedi</p>
            <p className="text-sm">Dosyaları görüntülemek için sol menüden bir klasör seçin</p>
          </div>
        ) : (
          <>
            {/* Dosya Alanı */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragEnd={resetDragState}
              className={`p-6 min-h-[500px] relative transition-colors duration-200 ease-in-out ${
                isDragging ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              {isDragging && (
                <div className="absolute inset-4 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center bg-blue-50 bg-opacity-90 backdrop-blur-sm z-10">
                  <div className="text-center text-blue-600">
                    <div className="text-4xl mb-2">📂</div>
                    <p className="text-lg font-medium">Dosyaları buraya bırakın</p>
                  </div>
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p>Henüz dosya yok</p>
                  <p className="text-sm mt-2">Dosyaları buraya sürükleyip bırakabilirsiniz</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {files.map(file => (
                    <div
                      key={file.id}
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow group relative"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                        {file.type.startsWith('image/') ? (
                          <div className="w-16 h-16 rounded overflow-hidden">
                            {/* Özel bir component yaparak img'yi render edelim */}
                            <FileImagePreview file={file} />
                          </div>
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                            <FileText size={24} className="text-blue-500" />
                          </div>
                        )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" title={file.name}>
                            {file.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2 bg-white py-1 px-2 rounded shadow">
                          <button 
                            onClick={() => setSelectedFile(file)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                            title="Önizle"
                          >
                            🔍
                          </button>
                          <button 
                            onClick={() => handleFileDownload(file)}
                            className="p-1 hover:bg-blue-50 rounded text-blue-600"
                            title="İndir"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
  
      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleFileUpload}
        currentFolder={currentFolder}
      />
  
      {selectedFile && (
      <FileViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
      )}
    </div>
  );
};

// Helper Types

interface CreateFolderResponse {
  id: string;
  name: string;
  createdBy: string;
  createdDate: string;
  parentId?: string;
  path: string;
}

// Type Guards

function isCreateFolderResponse(response: any): response is CreateFolderResponse {
  return (
    response &&
    typeof response.id === 'string' &&
    typeof response.name === 'string' &&
    typeof response.createdBy === 'string' &&
    typeof response.createdDate === 'string' &&
    (!response.parentId || typeof response.parentId === 'string') &&
    typeof response.path === 'string'
  );
}


export default FileManager;