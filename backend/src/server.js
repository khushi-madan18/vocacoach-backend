import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();


app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5174", "http://127.0.0.1:5174"],
    credentials: true,
  })
);


app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("API running"));

app.get("/oauth-callback", (req, res) => {
  res.send(`
    <h1>OAuth Test Successful</h1>
    <p>Here is your token:</p>
    <code>${req.query.token}</code>
  `);
});



app.listen(4000, () => {
  console.log("Server running on port 4000");
});
