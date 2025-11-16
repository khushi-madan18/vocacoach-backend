import axios from "axios";
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  BACKEND_URL,
  FRONTEND_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  OAUTH_STRATEGY,
  COOKIE_SECURE,
} = process.env;

export const googleAuth = (req, res) => {
  const redirect_uri = `${BACKEND_URL}/api/auth/google/callback`;

  const options = {
    redirect_uri,
    client_id: GOOGLE_CLIENT_ID,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  };

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams(options).toString();

  res.redirect(authUrl);
};

export const googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const profile = userRes.data;

    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          password: null,
          provider: "google",
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const redirectUrl = `${FRONTEND_URL}/oauth-callback?token=${token}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.log("OAuth error:", err.message);
    return res.status(500).json({ error: "OAuth failed" });
  }
};
