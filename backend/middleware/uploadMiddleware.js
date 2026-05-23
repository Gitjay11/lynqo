/**
 * uploadMiddleware.js — Multer + Cloudinary Upload Middleware
 *
 * Uses multer's memoryStorage to buffer the uploaded file, then streams it
 * to Cloudinary using the v2 SDK's upload_stream API. This approach is fully
 * compatible with cloudinary@^2.x and does not require multer-storage-cloudinary.
 *
 * Two middleware arrays are exported (arrays work identically to a single
 * middleware function in Express):
 *
 *  uploadAvatar     → stores to "campus-platform/avatars"  (2 MB limit)
 *  uploadPostImage  → stores to "campus-platform/posts"    (5 MB limit)
 *
 * After the middleware runs, controllers can read:
 *  req.file.path     — Cloudinary secure HTTPS URL
 *  req.file.filename — Cloudinary public_id
 *
 * Usage in routes (unchanged from before):
 *  import { uploadAvatar, uploadPostImage } from "../middleware/uploadMiddleware.js";
 *  router.post("/avatar", uploadAvatar, controller);
 *  router.post("/post",   uploadPostImage, controller);
 */

import multer from "multer";
import cloudinary from "../config/cloudinary.js";

// ── Allowed image MIME types ───────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// ── File filter — reject anything that is not an allowed image type ────────
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed."),
      false
    );
  }
};

// ── Memory storage — file is available as req.file.buffer ─────────────────
const memoryStorage = multer.memoryStorage();

// ── streamUpload — wraps upload_stream in a Promise ───────────────────────
// upload_stream is callback-based; this helper makes it async/await friendly.
//
// @param {Buffer} buffer        - The file buffer from multer memoryStorage
// @param {string} folder        - Cloudinary folder path
// @param {Object} options       - Any additional Cloudinary upload options
//   (e.g. transformation, allowed_formats)
// @returns {Promise<Object>}    - Cloudinary upload result object
const streamUpload = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Write the buffer into the stream and signal end of data
    uploadStream.end(buffer);
  });
};

// ── toCloudinary — middleware that streams req.file.buffer to Cloudinary ───
// Attaches result to req.file so controllers remain unchanged:
//   req.file.path     = result.secure_url  (the hosted HTTPS URL)
//   req.file.filename = result.public_id   (used for deletion later)
//
// @param {string} folder          - Cloudinary destination folder
// @param {Object} uploadOptions   - Cloudinary-specific options (transformations, etc.)
const toCloudinary = (folder, uploadOptions = {}) => {
  return async (req, res, next) => {
    // No file attached (optional upload) — skip silently
    if (!req.file) return next();

    try {
      const result = await streamUpload(req.file.buffer, folder, uploadOptions);

      // Preserve the same req.file shape that multer-storage-cloudinary produced
      req.file.path     = result.secure_url;
      req.file.filename = result.public_id;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ── uploadAvatar — 2 MB limit, square crop at 400x400 ────────────────────
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB in bytes

const avatarMulter = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: AVATAR_MAX_SIZE },
});

export const uploadAvatar = {
  single: (fieldName) => [
    avatarMulter.single(fieldName),
    toCloudinary("campus-platform/avatars", {
      transformation: [{ width: 400, height: 400, crop: "limit" }],
    }),
  ],
};

// ── uploadPostImage — 5 MB limit, width capped at 1200px ─────────────────
const POST_IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

const postImageMulter = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: POST_IMAGE_MAX_SIZE },
});

export const uploadPostImage = {
  single: (fieldName) => [
    postImageMulter.single(fieldName),
    toCloudinary("campus-platform/posts", {
      transformation: [{ width: 1200, crop: "limit" }],
    }),
  ],
};

