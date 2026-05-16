/**
 * uploadMiddleware.js — Multer + Cloudinary Upload Middleware
 *
 * Configures multer with CloudinaryStorage to handle file uploads.
 * Uploaded images are stored directly in Cloudinary under the
 * "campus-platform/avatars" folder.
 *
 * Constraints:
 *  - Allowed formats: jpg, jpeg, png, webp
 *  - Max file size: 2 MB
 *
 * Usage in routes:
 *   import { uploadAvatar } from "../middleware/uploadMiddleware.js";
 *   router.post("/profile", uploadAvatar.single("avatar"), controller);
 */

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// ── Cloudinary Storage — avatars ──────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campus-platform/avatars", // Cloudinary folder path
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Let Cloudinary auto-generate a unique public_id for each upload
    // This avoids filename collisions across users
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

// ── File filter — reject anything that isn't an image ─────────────────────
const imageFileFilter = (req, file, cb) => {
  // Check MIME type (more reliable than extension alone)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed."
      ),
      false
    );
  }
};

// ── Multer instance — 2 MB size limit ─────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});
