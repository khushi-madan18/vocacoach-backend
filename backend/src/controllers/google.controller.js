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
} = process.env;

// 1) Redirect user to Google
export const googleAuth = (req, res) => {
  const redirect_uri = `${BACKEND_URL}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
  );
};

// 2) Handle callback & exchange code for access token
export const googleCallback = async (req, res) => {
  const code = req.query.code;

  try {
    // GOOGLE REQUIRES form-urlencoded, NOT JSON
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const access_token = tokenResponse.data.access_token;

    // Fetch Google profile
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const profile = userResponse.data;

    let user = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          provider: "google",
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const redirectURL = `${FRONTEND_URL}/oauth-callback?token=${token}`;
    return res.redirect(redirectURL);
  } catch (err) {
    console.error("OAuth error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: "OAuth failed", details: err.response?.data || err.message });
  }
};
