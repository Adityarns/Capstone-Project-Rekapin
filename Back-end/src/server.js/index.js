import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "../routes/route.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Capstone Rekapin API",
      version: "1.0.0",
      description:
        "Dokumentasi API untuk backend Rekapin menggunakan Swagger UI.",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Local server",
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
    "./src/service/auth/routes/*.js",
    "./src/service/users/routes/*.js",
    "./src/service/businesses/routes/*.js",
    "./src/service/teams/routes/*.js",
    "./src/service/auth/controller/*.js",
    "./src/service/users/controller/*.js",
    "./src/service/businesses/controller/*.js",
    "./src/service/teams/controller/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  cors({
    origin: true,
  }),
);

app.get("/api-docs-json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
