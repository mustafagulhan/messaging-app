// src/components/Welcome/Welcome.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Typewriter from 'typewriter-effect';

const Welcome = () => {
 const navigate = useNavigate();

 return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8 text-gray-800">Güvenli Mesajlaşma ve Bulut Depolama Platformu</h1>
        
        <div className="h-24 text-xl mb-8 text-gray-600">
          <Typewriter
            options={{
              strings: [
                'Uçtan uca şifreleme',
                'Güvenli dosya paylaşımı',
                'Özel mesajlaşma',
              ],
              autoStart: true,
              loop: true,
            }}
          />
        </div>
   
        <div className="space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Kayıt Ol
          </button>
        </div>
      </div>
    </div>
   );
};

export default Welcome;