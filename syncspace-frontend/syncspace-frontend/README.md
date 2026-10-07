# SyncSpace Frontend

React 18 + Vite client for the SyncSpace backend (Express, Socket.IO, Yjs, MongoDB).

## Run
1. Start the backend: `cd syncspace-backend && npm install && npm run dev` (port 5000, MongoDB running).
2. Frontend:
   ```
   npm install
   cp .env.example .env     # VITE_API_URL=http://localhost:5000
   npm run dev              # http://localhost:5173
   ```
3. Make sure the backend `.env` has `CLIENT_URL=http://localhost:5173` (CORS / Socket.IO origin).
4. Register two accounts, create a workspace and a room, and invite the second account to both. Accept invitations from the Invitations page, then open the room in both browsers to try live collaboration.

## Features
- JWT auth (register / login), protected routes
- Workspaces, members, rooms, invitations
- Room: split-pane whiteboard (Konva) + Monaco editor, both synced through one Yjs doc over Socket.IO
- Whiteboard: pen, rectangle, ellipse, line, arrow, text, eraser, select/drag, pan, zoom, undo/redo, PNG export, live remote cursors and live strokes
- Editor: conflict-free concurrent typing, remote cursors with names, typing indicator, shared language switch
- Presence avatars and collaborator names, online count, connection status, room invitations, offline edits resync on reconnect
- Session replay: scrub or play through saved snapshots (code and board)

## Structure
```
src/api/client.js        REST client
src/lib/useCollab.js     socket + Yjs session hook
src/components/          Whiteboard, CodeEditor, ReplayDrawer, AppShell, ui
src/pages/               Auth, Workspaces, WorkspaceDetail, Room, Invitations, Profile
```
Monaco loads from a CDN by default, so the browser needs internet access.

## Git workflow (Axlero rules)
Commit to your own branch every day, then merge into `main` through the team lead.
