/**
 * cloudinary.js — Cloudinary Configuration
 * Initialises the Cloudinary SDK with credentials from .env.
 * Import this file wherever you need to interact with Cloudinary.
 */

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
