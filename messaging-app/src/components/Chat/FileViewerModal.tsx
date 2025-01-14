import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

interface FileViewerModalProps {
    file: {
        id: string;
        name: string;
        type: string;
        size: number;
        isMessage?: boolean;
    };
    onClose: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, onClose }) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const endpoint = file.isMessage
                    ? `/api/messages/files/${file.id}`
                    : `/api/files/files/${file.id}`;

                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Dosya yüklenemedi');

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setContent(url);
                setError(null);
            } catch (error) {
                console.error('Preview error:', error);
                setError('Dosya önizlemesi yüklenirken bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        loadPreview();

        return () => {
            if (content) {
                URL.revokeObjectURL(content);
            }
        };
    }, [file.id, file.isMessage]);

    const handleDownload = async () => {
        if (!content) return;

        const a = document.createElement('a');
        a.href = content;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const renderContent = () => {
        if (error) {
            return <div className="text-red-500 text-center p-4">{error}</div>;
        }

        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
            );
        }

        if (!content) {
            return <div className="text-center text-gray-500">Önizleme yüklenemedi</div>;
        }

        if (file.type === 'application/pdf') {
            return (
                <div className="w-full h-[80vh] relative">
                    <object
                        data={content}
                        type="application/pdf"
                        className="w-full h-full"
                    >
                        <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-gray-500 mb-4">PDF görüntüleyici yüklenemedi</p>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                            >
                                <Download size={18} className="mr-2" />
                                İndir
                            </button>
                        </div>
                    </object>
                </div>
            );
        }

        if (file.type.startsWith('image/')) {
            return (
                    <img
                        src={content}
                        alt={file.name}
                        style={{ maxWidth: '100%', height: 'auto' }}
                        onError={() => setError('Görüntü yüklenemedi')}
                    />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-8">
                <FileText size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">Bu dosya türü için önizleme desteklenmiyor</p>
                <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                >
                    <Download size={18} className="mr-2" />
                    İndir
                </button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium">{file.name}</h3>
                        <span className="text-sm text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="İndir"
                        >
                            <Download size={20} className="text-gray-500" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                            title="Kapat"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default FileViewerModal;