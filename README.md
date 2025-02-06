# Secure Messaging and Encrypted Cloud Storage Platform

A secure messaging and encrypted cloud storage platform developed using modern web technologies. This platform enables users to communicate securely and store their files in an encrypted format.

## Features

### Message Security
- End-to-end encryption support
- Choice of 5 different encryption algorithms:
  - AES (Advanced Encryption Standard)
  - Blowfish
  - RSA (Rivest-Shamir-Adleman)
  - Vigenere
  - Base64
- Real-time secure communication over WebSocket
- Read receipts and online status

### File Storage
- Large file support with MongoDB GridFS
- File encryption in 255KB chunks
- AES and Blowfish encryption support
- Hierarchical folder structure
- File preview and detailed metadata information

### Security Measures
- JWT-based authentication
- Email verification system
- Rate limiting protection
- SQL Injection, XSS, and CSRF protection
- Multi-factor session security
- Argon2 password hashing

## Technologies

### Backend
- Python 3.9
- FastAPI Framework
- MongoDB 6.0
- WebSocket
- JWT Authentication

### Frontend
- React 18.0
- TypeScript
- Tailwind CSS 3.0
- React Context API
- Axios

### Security Libraries
- python-jose
- passlib
- cryptography
- pycryptodome

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mustafagulhan/messaging-app
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Environment Variables Setup:
   * Copy `.env.example` to create a new `.env` file:
     ```bash
     cp .env.example .env
     ```
   * Update the `.env` file with your configuration:
     ```bash
     # MongoDB Configuration
     MONGODB_URI=         # Your MongoDB connection string

     # JWT Configuration
     SECRET_KEY=         # Random string for JWT signing
     ALGORITHM=      # Default: HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=  # Default: 30
     UPLOAD_FOLDER # Default: uploads

     # Email Configuration
     BREVO_API_KEY=      # Your brevo email service API key
     BREVO_SENDER_EMAIL=       # Sender brevo email address
     ```
   * Note: Never commit your actual `.env` file to version control. The `.env.example` file serves as a template.

5. Start the application:
```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend
cd frontend
npm start
```

## System Requirements
- Python 3.9 or higher
- Node.js 16 or higher
- MongoDB 6.0 or higher

## Security Features
- End-to-end encryption for all messages
- Client-side encryption for file uploads
- Secure session management
- Protection against common web vulnerabilities
- Rate limiting for brute force attack prevention

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Contact
Mustafa Gülhan - [GitHub](https://github.com/mustafagulhan)

## Acknowledgments
- Special thanks to Asst. Prof. Dr. İhsan PENÇE for project supervision.
- Thanks to all contributors who participated in testing and development.
