import { Router } from "express";
import { changeCurrentPassword, csrfToken, currentUser, forgotPassword, login, logout, register, resetPassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import requireCsrf from "../middleware/csrf.js";
import { updateProfile } from "../controllers/profile.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, requireCsrf, logout);
router.get("/me", requireAuth, currentUser);
router.patch("/profile", requireAuth, requireCsrf, updateProfile);
router.get("/csrf", requireAuth, csrfToken);
router.patch("/password", requireAuth, requireCsrf, changeCurrentPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
