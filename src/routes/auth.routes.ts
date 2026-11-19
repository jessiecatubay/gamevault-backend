import { Router } from "express";
import {
  currentUser,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  registerSchema,
} from "../validation/auth.validation.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema, "body"), register);
authRouter.post("/login", validate(loginSchema, "body"), login);
authRouter.get("/me", authenticate, currentUser);
authRouter.post("/logout", authenticate, logout);
