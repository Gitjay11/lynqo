/**
 * uploadMiddleware.js — Multer + Cloudinary Upload Middleware
 *
 * Configures multer with CloudinaryStorage to handle file uploads.
 * Two separate multer instances are exported:
 *
 *  uploadAvatar    → stores to "campus-platform/avatars"  (2 MB limit)
 *  uploadPostImage → stores to "campus-platform/posts"     (5 MB limit)
 *
 * Constraints:
 *  - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
 *  - File size limits differ per upload type (see above)
 *
 * Usage in routes:
 *   import { uploadAvatar, uploadPostImage } from "../middleware/uploadMiddleware.js";
 *   router.post("/avatar",   uploadAvatar.single("avatar"),   controller);
 *   router.post("/post",     uploadPostImage.single("image"),  controller);
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

// ── Multer instance — Avatar (2 MB limit) ────────────────────────────────
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: AVATAR_MAX_SIZE,
  },
});

// ── Cloudinary Storage — post images ─────────────────────────────────────
// Separate storage config so post images land in their own Cloudinary folder,
// making it easy to apply folder-level policies (e.g. auto-moderation) later.
const postImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campus-platform/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Wider crop for feed images — preserve aspect ratio up to 1200px wide
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

// ── Multer instance — Post image (5 MB limit) ─────────────────────────────
const POST_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadPostImage = multer({
  storage: postImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: POST_IMAGE_MAX_SIZE,
  },
});
