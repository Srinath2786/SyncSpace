const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const roomRoutes = require("./routes/roomRoutes");
const documentRoutes = require("./routes/documentRoutes");
const documentHistoryRoutes = require("./routes/documentHistoryRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const notFoundMiddleware = require("./middleware/notFoundMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const { swaggerDocument, swaggerHtml } = require("./docs/swagger");

const app = express();

// Serve static files from public folder
app.use(express.static("public"));

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SyncSpace Backend API is running",
  });
});

// Swagger / OpenAPI docs
app.get("/api-docs", (req, res) => {
  res.send(swaggerHtml);
});

app.get("/openapi.json", (req, res) => {
  res.json(swaggerDocument);
});

// Authentication routes
app.use("/api/auth", authRoutes);

// User routes
app.use("/api/users", userRoutes);

// Workspace routes
app.use("/api/workspaces", workspaceRoutes);

// Room routes
app.use("/api/rooms", roomRoutes);

// Document routes
app.use("/api/documents", documentRoutes);
app.use("/api/documents/history", documentHistoryRoutes);
app.use("/api/invitations", invitationRoutes);

// Collaboration routes
app.use("/api/collaboration", collaborationRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;