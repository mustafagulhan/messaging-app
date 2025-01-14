// src/components/Layout/AppLayout.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatContainer from '../Chat/ChatContainer';
import FileManager from '../Files/FileManager';

const AppLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<ChatContainer />} />
                        <Route path="/messages" element={<ChatContainer />} />
                        <Route path="/files" element={<FileManager />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;