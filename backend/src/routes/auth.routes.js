import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { googleAuth, googleCallback } from "../controllers/google.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

export default router;
