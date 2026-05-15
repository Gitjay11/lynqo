/**
 * generateToken.js — JWT Token Generator
 * Creates a signed JWT containing the user's ID.
 * The token is returned to the client on login/signup.
 */

import jwt from "jsonwebtoken";

/**
 * @param {string} userId — MongoDB ObjectId of the authenticated user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;
