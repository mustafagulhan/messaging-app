// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AppLayout from './components/Layout/AppLayout';
import EmailVerification from './components/Auth/EmailVerification';
import { useAuth } from './context/AuthContext';
import Welcome from './components/Welcome/Welcome';
import VerificationSuccess from './components/Auth/VerificationSuccess';

function App() {
 return (
   <Router>
     <AuthProvider>
       <Routes>
         <Route path="/" element={<Welcome />} />
         <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
         <Route path="/verify-email" element={<EmailVerification />} />
         <Route path="/verification-success" element={<VerificationSuccess />} />
         <Route path="/*" element={
           <ProtectedRoute>
             <AppLayout />
           </ProtectedRoute>
         } />
       </Routes>
     </AuthProvider>
   </Router>
 );
}

interface ProtectedRouteProps {
 children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
 const { user } = useAuth();
 
 if (!user) {
   return <Navigate to="/login" />;
 }
 
 return <>{children}</>;
};

export default App;