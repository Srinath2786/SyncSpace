const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SyncSpace API",
      version: "1.0.0",
      description:
        "Professional API documentation for the SyncSpace collaboration platform.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local backend server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: [
    "./routes/*.js",
  ],
};

module.exports = swaggerJsdoc(options);