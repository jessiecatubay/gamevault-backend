import { Router } from "express";
import {
  createWishlistEntry,
  deleteWishlistEntry,
  listWishlist,
  purchaseWishlistEntry,
  updateWishlistEntry,
} from "../controllers/wishlist.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createWishlistEntrySchema,
  updateWishlistEntrySchema,
  wishlistIdSchema,
} from "../validation/wishlist.validation.js";

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);
wishlistRouter.get("/", listWishlist);
wishlistRouter.post("/", validate(createWishlistEntrySchema, "body"), createWishlistEntry);
wishlistRouter.post(
  "/:id/purchase",
  validate(wishlistIdSchema, "params"),
  purchaseWishlistEntry,
);
wishlistRouter.patch(
  "/:id",
  validate(wishlistIdSchema, "params"),
  validate(updateWishlistEntrySchema, "body"),
  updateWishlistEntry,
);
wishlistRouter.delete("/:id", validate(wishlistIdSchema, "params"), deleteWishlistEntry);
