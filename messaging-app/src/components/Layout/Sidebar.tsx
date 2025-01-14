// src/components/Layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/messages', name: 'Mesajlar', icon: '💬' },
        { path: '/files', name: 'Dosyalar', icon: '📁' }
    ];

    return (
        <div className="w-64 bg-white border-r h-full">
            <div className="p-4">
                <div className="space-y-2">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md ${
                                location.pathname === item.path
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;