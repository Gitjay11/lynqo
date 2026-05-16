/**
 * User.js — Mongoose User Model
 *
 * Defines the schema for platform users (college students).
 * Handles:
 *  - Field validation (name, email domain, password length, semester range)
 *  - Password hashing via bcryptjs pre-save hook
 *  - Password comparison via instance method matchPassword()
 *
 * College email domain is configurable via the ALLOWED_EMAIL_DOMAINS constant.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ── Configurable college email domains ─────────────────────────────────────
// Add or remove domains as needed. Only emails ending with one of these
// domains will be accepted during registration.
const ALLOWED_EMAIL_DOMAINS = ["@college.edu"];

// ── Password hashing config ────────────────────────────────────────────────
const SALT_ROUNDS = 12;

// ── User Schema ────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          // Check that the email ends with at least one allowed domain
          return ALLOWED_EMAIL_DOMAINS.some((domain) =>
            value.endsWith(domain)
          );
        },
        message: `Email must end with one of: ${ALLOWED_EMAIL_DOMAINS.join(", ")}`,
      },
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
    },

    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be between 1 and 8"],
      max: [8, "Semester must be between 1 and 8"],
    },

    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters"],
    },

    profilePicture: {
      type: String,
      default: "",
    },
  },
  {
    // Adds createdAt and updatedAt fields automatically
    timestamps: true,
  }
);

// ── Pre-save hook — hash password before persisting ────────────────────────
// Only hashes the password when it has been modified (new user or password
// change), preventing unnecessary re-hashing on other field updates.
//
// NOTE (Mongoose v7+): async pre-hooks must NOT use the `next` callback.
// The hook resolves via the returned promise — throw to propagate errors,
// return to signal completion. Calling next() in an async hook is undefined.
userSchema.pre("save", async function () {
  // Skip hashing if the password field hasn't been modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  // Any thrown error will be caught by Mongoose and forwarded to next(err)
});

// ── Instance method — compare entered password with stored hash ────────────
// Usage: const isMatch = await user.matchPassword("plainTextPassword");
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Create and export the model ────────────────────────────────────────────
const User = mongoose.model("User", userSchema);
export default User;
