# SyncSpace

SyncSpace is a real-time collaborative workspace platform for teams to create, organize, and work together inside shared rooms. The backend powers authentication, workspace management, room collaboration, document syncing, and live Socket.IO events for presence and editing activity.

## Project Overview

The SyncSpace backend provides:
- JWT-based authentication
- Workspace and room management
- Real-time collaboration using Socket.IO
- Shared document handling per room
- Presence and activity tracking
- OpenAPI documentation for API discovery

## Features

- User registration and login
- Workspace creation and member management
- Room creation and organization inside workspaces
- Document updates per room
- Live code editing events
- Cursor and typing notifications
- Online-user and presence detection
- Structured API and Swagger documentation

## Architecture

```text
syncspace-backend/
├── app.js
├── server.js
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
├── validators/
├── utils/
├── docs/
├── public/
├── tests/
├── .env
├── .env.example
├── README.md
└── package.json
```

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- CORS
- Swagger/OpenAPI documentation

## Installation

1. Install dependencies

```bash
npm install
```

2. Create your environment file

```bash
cp .env.example .env
```

3. Start the backend

```bash
npm start
```

4. For development mode with watcher

```bash
npm run dev
```

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syncspace
JWT_SECRET=syncspace_super_secret_change_this
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## API Documentation

Swagger documentation is available at:

```text
http://localhost:5000/api-docs
```

The raw OpenAPI document is available at:

```text
http://localhost:5000/openapi.json
```

## Database Design

### User
- name
- email
- password
- avatar
- timestamps

### Workspace
- name
- description
- owner
- members
- timestamps

### Room
- name
- workspace
- createdBy
- members
- language
- timestamps

### Document
- room
- content
- language
- updatedBy
- timestamps

### Activity
- user
- workspace
- room
- action
- details
- timestamps

## Socket.IO Events

### Client-to-server
- join-room
- leave-room
- code-change
- cursor-change
- typing

### Server-to-client
- user-joined
- user-left
- code-change
- cursor-change
- typing
- online-users
- presence-update
- room-error

## Screenshots

Add screenshots of the dashboard, collaboration editor, and room UI here.

## Future Enhancements

- Rich text editor integration
- Real-time collaboration conflict resolution
- Team roles and permissions
- Cloud storage and file exports
- Advanced analytics and activity timeline
- Notification system and mentions

## Team / Contributors

This backend was developed as part of the SyncSpace collaboration platform and can be extended by a full-stack team or contributors working on:
- frontend UI
- real-time editor integration
- database optimization
- API security and rate limiting
- analytics and monitoring


srinath@test.com

