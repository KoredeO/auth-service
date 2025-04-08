# NestJS Authentication Service 🔐

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
</p>

A robust authentication service built with NestJS, featuring email verification, Google OAuth, and JWT authentication.

## Features ✨

- 🔑 Local authentication with email and password
- 🌐 Google OAuth integration
- ✉️ Email verification system
- 🔒 JWT-based authentication
- 🔄 Password reset functionality
- 🛡️ MongoDB integration for user management

## Tech Stack 🛠️

- **Framework**: NestJS v11
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js, JWT
- **Email**: Nodemailer
- **Validation**: class-validator
- **Security**: bcrypt

## Prerequisites 📋

- Node.js (v18 or higher)
- MongoDB instance
- Google OAuth credentials (for Google sign-in)
- SMTP server credentials (for email verification)

## Getting Started 🚀

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # App
   PORT=3000

   # MongoDB
   MONGODB_URI=your_mongodb_uri

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=24h

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=your_google_callback_url

   # Email
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ```

3. **Start the Server**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## API Endpoints 🌐

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Google OAuth login
- `GET /auth/verify/:token` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### User Management
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

## Security Features 🛡️

- Password hashing with bcrypt
- JWT-based session management
- Email verification for new accounts
- Rate limiting on authentication endpoints
- Secure password reset flow

## Testing 🧪

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License 📄

This project is [MIT licensed](LICENSE).

