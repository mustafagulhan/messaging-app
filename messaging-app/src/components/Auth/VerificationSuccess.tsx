// src/components/Auth/VerificationSuccess.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VerificationSuccess: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000);  // 5 saniye sonra login'e yönlendir

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
                <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Email Doğrulaması Başarılı!
                </h2>

                <p className="text-gray-600 mb-8">
                    Hesabınız başarıyla doğrulandı. 
                    <br />
                    Giriş sayfasına yönlendiriliyorsunuz...
                </p>

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>

                <button
                    onClick={() => navigate('/login')}
                    className="mt-6 text-blue-600 hover:text-blue-800 font-medium"
                >
                    Hemen giriş yap
                </button>
            </div>
        </div>
    );
};

export default VerificationSuccess;