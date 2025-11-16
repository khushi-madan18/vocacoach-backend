import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://vocacoach-frontend.vercel.app"
    ],
    credentials: true,
  })
);


app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

// For debugging Google OAuth callback
app.get("/oauth-callback", (req, res) => {
  res.send(`
    <h2>OAuth Callback Reached</h2>
    <p>Your token:</p>
    <code>${req.query.token}</code>
  `);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
