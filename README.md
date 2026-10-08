# 🚀 SyncSpace — Real-Time Collaborative Workspace

**SyncSpace** is a real-time collaborative workspace platform designed for teams to create shared workspaces, organize collaboration rooms, and work together through live code and document editing.

The backend provides secure authentication, workspace and room management, persistent document storage, real-time collaboration using **Socket.IO**, presence tracking, activity events, and interactive **Swagger/OpenAPI** documentation.

---

## ✨ Highlights

* 🔐 JWT-based authentication
* 👥 Workspace and member management
* 🏠 Room-based collaboration
* ⚡ Real-time communication with Socket.IO
* 💻 Live collaborative code editing
* 🖱️ Cursor movement synchronization
* ⌨️ Typing indicators
* 🟢 Online-user and presence tracking
* 📄 Persistent room documents
* 📊 Workspace and room activity tracking
* 📚 Swagger/OpenAPI API documentation
* 🛡️ Middleware-based authentication and validation
* 🗄️ MongoDB persistence using Mongoose

---

## 🎯 Project Overview

SyncSpace is built around the idea of providing teams with a shared digital workspace where members can collaborate in real time.

A typical workflow looks like:

```text
User
 │
 ▼
Authentication
 │
 ▼
Workspace
 │
 ├── Members
 │
 └── Rooms
      │
      ├── Shared Document
      │
      ├── Live Code Editing
      │
      ├── Cursor Updates
      │
      ├── Typing Indicators
      │
      └── Presence Tracking
```

The backend manages both **persistent application data** through MongoDB and **real-time collaboration events** through Socket.IO.

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │   SyncSpace Client  │
                         │  Web / Frontend UI  │
                         └──────────┬──────────┘
                                    │
                         HTTP / REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Express.js       │
                         │      Server         │
                         └──────────┬──────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │ Authentication│    │ REST APIs    │    │ Socket.IO    │
        │    & JWT      │    │ Controllers  │    │ Real-Time    │
        └──────────────┘    └──────────────┘    └──────┬───────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    ▼
                           ┌─────────────────┐
                           │    Services     │
                           │ Business Logic  │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │ MongoDB /       │
                           │    Mongoose     │
                           └─────────────────┘
```

---

## 🛠️ Tech Stack

| Technology            | Purpose                    |
| --------------------- | -------------------------- |
| **Node.js**           | JavaScript runtime         |
| **Express.js**        | Backend web framework      |
| **MongoDB**           | Database                   |
| **Mongoose**          | MongoDB ODM                |
| **Socket.IO**         | Real-time communication    |
| **JWT**               | Authentication             |
| **CORS**              | Cross-origin communication |
| **Swagger / OpenAPI** | API documentation          |
| **JavaScript**        | Backend development        |

---

## 📁 Project Structure

```text
syncspace-backend/
│
├── app.js
├── server.js
├── package.json
├── README.md
│
├── config/
│   └── database configuration
│
├── controllers/
│   └── request handling and business operations
│
├── middleware/
│   └── authentication, validation and error handling
│
├── models/
│   └── MongoDB / Mongoose models
│
├── routes/
│   └── REST API routes
│
├── services/
│   └── application business logic
│
├── sockets/
│   └── Socket.IO real-time event handling
│
├── validators/
│   └── request validation
│
├── utils/
│   └── reusable utility functions
│
├── docs/
│   └── OpenAPI / Swagger documentation
│
├── public/
│   └── public assets
│
├── tests/
│   └── backend tests
│
├── .env.example
└── .gitignore
```

---

# 🔐 Authentication

SyncSpace uses **JSON Web Tokens (JWT)** to secure protected resources.

### Authentication Flow

```text
Register
   │
   ▼
Login
   │
   ▼
JWT Token
   │
   ▼
Authorization Header
   │
   ▼
Protected API / Socket Connection
```

Authenticated requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

# 👥 Workspace Management

Users can create and manage collaborative workspaces.

A workspace can contain:

* Workspace name
* Description
* Owner
* Members
* Multiple collaboration rooms
* Activity information

Example:

```text
Workspace
│
├── Owner
├── Members
│
├── Room: Java Practice
├── Room: Project Development
└── Room: Team Discussion
```

---

# 🏠 Room Collaboration

Rooms provide isolated collaboration spaces inside a workspace.

Each room can maintain:

* Room name
* Workspace association
* Room members
* Programming language
* Shared document
* Real-time collaboration state

---

# ⚡ Real-Time Collaboration

SyncSpace uses **Socket.IO** to provide real-time collaboration between connected users.

Multiple users can join the same room and receive updates without refreshing the page.

### Real-Time Flow

```text
User A
   │
   │ code-change
   ▼
Socket.IO Server
   │
   ├──────────────► User B
   │
   └──────────────► User C
```

This enables a collaborative editing experience similar to modern online development tools.

---

# 🔄 Socket.IO Events

## Client → Server

| Event           | Description                              |
| --------------- | ---------------------------------------- |
| `join-room`     | Join a collaboration room                |
| `leave-room`    | Leave a collaboration room               |
| `code-change`   | Send code/document changes               |
| `cursor-change` | Send cursor position                     |
| `typing`        | Notify other users about typing activity |

## Server → Client

| Event             | Description                        |
| ----------------- | ---------------------------------- |
| `user-joined`     | Notifies users when someone joins  |
| `user-left`       | Notifies users when someone leaves |
| `code-change`     | Broadcasts document changes        |
| `cursor-change`   | Synchronizes cursor position       |
| `typing`          | Sends typing notifications         |
| `online-users`    | Provides active users              |
| `presence-update` | Updates user presence              |
| `room-error`      | Reports room-related errors        |

---

# 🗄️ Database Design

## User

```text
User
├── name
├── email
├── password
├── avatar
└── timestamps
```

## Workspace

```text
Workspace
├── name
├── description
├── owner
├── members
└── timestamps
```

## Room

```text
Room
├── name
├── workspace
├── createdBy
├── members
├── language
└── timestamps
```

## Document

```text
Document
├── room
├── content
├── language
├── updatedBy
└── timestamps
```

## Activity

```text
Activity
├── user
├── workspace
├── room
├── action
├── details
└── timestamps
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* **Node.js**
* **npm**
* **MongoDB**
* **Git**

Check your installations:

```bash
node --version
npm --version
mongod --version
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/Srinath2786/SyncSpace.git
```

Move into the backend directory:

```bash
cd SyncSpace
```

> If the backend is maintained in a separate directory or branch, switch to the appropriate backend branch before continuing.

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file based on `.env.example`.

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/syncspace

JWT_SECRET=change_this_to_a_secure_secret

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

### ⚠️ Security

Never commit your real `.env` file or production secrets to GitHub.

Use:

```text
.env
```

in your `.gitignore`.

---

## 4. Start MongoDB

Make sure MongoDB is running locally.

The default database used by SyncSpace is:

```text
syncspace
```

---

## 5. Start the Backend

### Production-style start

```bash
npm start
```

### Development mode

```bash
npm run dev
```

The backend should be available at:

```text
http://localhost:5000
```

---

# 📚 API Documentation

SyncSpace provides interactive API documentation using Swagger/OpenAPI.

After starting the backend, open:

```text
http://localhost:5000/api-docs
```

The raw OpenAPI specification is available at:

```text
http://localhost:5000/openapi.json
```

Swagger can be used to:

* Explore available endpoints
* Understand request parameters
* Inspect responses
* Test APIs
* Review authentication requir
