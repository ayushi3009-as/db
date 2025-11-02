# EchoVault - Complete Social Media Dashboard Setup Guide

## 🎯 Overview

EchoVault is a complete social media platform with user authentication, post management, and comprehensive admin controls. This guide will help you set up the entire system from scratch.

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **MongoDB** (version 4.4 or higher)
- **npm** (comes with Node.js)

## 🚀 Quick Start

### 1. Database Setup

#### Option A: Install MongoDB Locally
```bash
# On macOS
brew install mongodb-community

# On Ubuntu/Debian
sudo apt-get install -y mongodb

# On Windows
# Download and install from https://www.mongodb.com/try/download/community
```

#### Option B: Use MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `.env` file with your connection string

#### Option C: Use Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
touch .env
```

#### Environment Configuration
Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/echo_vault

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for production)
CORS_ORIGIN=http://localhost:3000
```

### 3. Start the Backend Server

```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The server should now be running on `http://localhost:5000`

### 4. Frontend Setup

#### User Dashboard
```bash
# Open the user dashboard in your browser
# Navigate to frontend/user-dashboard/index.html
```

#### Admin Dashboard
```bash
# Open the admin dashboard in your browser
# Navigate to frontend/admin-dashboard/index.html
```

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/auth/status` - Check authentication status

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/users` - Get all users with pagination
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/toggle` - Toggle user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/posts` - Get all posts (including deleted)
- `DELETE /api/admin/posts/:id` - Delete any post
- `POST /api/admin/posts/:id/restore` - Restore deleted post
- `GET /api/admin/analytics` - Get system analytics
- `POST /api/admin/users/create-admin` - Create new admin user

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post (author only)
- `DELETE /api/posts/:id` - Delete post (author or admin)
- `POST /api/posts/:id/like` - Toggle like on post
- `GET /api/posts/user/:userId` - Get user's posts

## ✅ Features Implemented

### User Dashboard
- User registration and login with secure password hashing
- Profile management (name, bio)
- Create, read, update, delete posts
- Like/unlike posts functionality
- Time-sorted post feed with infinite scroll
- Responsive design for all devices
- Real-time updates

### Admin Dashboard
- Admin authentication
- User management (view, activate/deactivate, delete)
- Post management (view, delete, restore)
- System analytics and statistics
- Search and filtering capabilities
- Create new admin users

### Security Features
- bcrypt password hashing (12 salt rounds)
- Session-based authentication with secure cookies
- Input validation and sanitization
- XSS protection
- Rate limiting (10 posts/hour)
- Role-based access control

## 🔧 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# On macOS
brew services start mongodb/brew/mongodb-community
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)
```

## 📊 Project Status: COMPLETE ✅

All core features have been implemented according to the planning specifications:

- ✅ Complete authentication system
- ✅ Post management with CRUD operations
- ✅ User dashboard with profile and post feed
- ✅ Admin dashboard with comprehensive management
- ✅ Security measures and input validation
- ✅ Responsive design and modern UI
- ✅ API endpoints for all functionality

The system is ready for deployment and use! 🚀