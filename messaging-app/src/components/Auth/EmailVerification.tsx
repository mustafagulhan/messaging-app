// src/components/Auth/EmailVerification.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmailVerification: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('Lütfen 6 haneli kodu eksiksiz girin');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:8080/api/auth/verify/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Doğrulama kodunu kontrol edin');
      }

      navigate('/verification-success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Email Doğrulama
          </h2>
          <p className="mt-2 text-gray-600">
            Email adresinize gönderilen 6 haneli doğrulama kodunu girin
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-center text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              className="w-48 h-14 text-center text-3xl tracking-widest border rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       transition duration-200"
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium
                       transition duration-200 ${
                         isLoading || code.length !== 6
                           ? 'bg-gray-400 cursor-not-allowed'
                           : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                       }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  <span>Doğrulanıyor...</span>
                </div>
              ) : (
                'Doğrula'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800 transition duration-200"
          >
            Giriş sayfasına dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;