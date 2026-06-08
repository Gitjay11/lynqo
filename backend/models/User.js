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

// ── Password hashing rounds ────────────────────────────────────────────────

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
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Please enter a valid email address",
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

    // ── Social graph ────────────────────────────────────────────────────────
    // Arrays of ObjectId references to other User documents.
    // Default to empty arrays so existing users need no migration.
    // $addToSet is used on all writes to prevent duplicate entries.
    followers: {
      type:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    following: {
      type:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    // ── Extended optional profile fields ─────────────────────────────────────
    // All fields below are optional (no `required`). Existing documents will
    // simply have these fields as undefined / default — no migration needed.

    // Personal Information
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say", ""],
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    // Academic Information
    yearOfJoining: {
      type: Number,
      default: null,
    },

    rollNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Campus Life
    hostelOrDay: {
      type: String,
      enum: ["Hostel", "Day Scholar", ""],
      default: "",
    },

    clubs: {
      type: String,
      trim: true,
      default: "",
    },

    // Skills & Interests — stored as arrays of strings
    skills: {
      type:    [String],
      default: [],
    },

    hobbies: {
      type:    [String],
      default: [],
    },

    // "Looking For" — validated against a fixed set of chips
    lookingFor: {
      type:    [String],
      enum:    ["Study Partner", "Project Collab", "Hackathon Team", "Friends", "Networking"],
      default: [],
    },

    // Social Links
    github: {
      type: String,
      trim: true,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      default: "",
    },

    instagram: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    // Adds createdAt and updatedAt fields automatically
    timestamps: true,
  }
);

// ── Text index for global search ────────────────────────────────────────────
// Allows case-insensitive full-text search across name and branch in a single
// query. searchUsers() in searchController uses a regex fallback so both
// the text index (Atlas) and vanilla Mongo (local dev) work correctly.
userSchema.index({ name: "text", branch: "text" });

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
