import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "../routes/route.js";
const app = express();

app.use(
  cors({
    origin: true,
  }),
);

app.use(express.json());
app.use(routes);

export default app;
