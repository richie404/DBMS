import { Router } from "express";
import { changeCurrentPassword, csrfToken, currentUser, forgotPassword, login, logout, register, resetPassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import requireCsrf from "../middleware/csrf.js";

const router = Router();
router.use((req,res,next)=>{res.set("Cache-Control","no-store");next();});

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, requireCsrf, logout);
router.get("/me", requireAuth, currentUser);
router.get("/csrf", requireAuth, csrfToken);
router.patch("/password", requireAuth, requireCsrf, changeCurrentPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
