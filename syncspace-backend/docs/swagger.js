const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "SyncSpace API",
    version: "1.0.0",
    description: "Professional API documentation for the SyncSpace collaboration platform.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local backend server",
    },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User created" },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/workspaces": {
      get: {
        summary: "Get authenticated user workspaces",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Success" } },
      },
      post: {
        summary: "Create workspace",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Workspace created" } },
      },
    },
    "/api/rooms": {
      post: {
        summary: "Create room",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Room created" } },
      },
    },
    "/api/documents/{roomId}": {
      get: {
        summary: "Get room document",
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "roomId", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Document loaded" } },
      },
      put: {
        summary: "Update room document",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Document updated" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SyncSpace API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #111827; color: #f9fafb; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 20px; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SupportedSpec],
        layout: 'BaseLayout',
      });
    </script>
  </body>
</html>
`;

module.exports = {
  swaggerDocument,
  swaggerHtml,
};
