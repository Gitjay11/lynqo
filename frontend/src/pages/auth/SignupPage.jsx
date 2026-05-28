/**
 * SignupPage.jsx — User Registration Page (Dark Theme)
 *
 * Layout rules (mobile-first):
 *  - Mobile (default / < 640px): Full-screen form. No card. Logo at top center.
 *    px-6 py-8 padding. All inputs full-width, h-12. Button full-width, h-12.
 *  - sm: (640px+): zinc-900 card — max-w-md mx-auto rounded-2xl shadow-lg p-8.
 *    Page background stays zinc-950.
 *  - md: and above: Same card, page background stays zinc-950.
 *
 * Behavior:
 *  - Client-side validation fires on submit (not on each keystroke).
 *  - Field-level inline errors shown below each input.
 *  - On valid submit → POST /api/auth/register.
 *  - On success   → login(user, token) from AuthContext → navigate to /feed.
 *  - On API error → show error toast with the server message.
 *  - Submit button disabled + spinner while request is in flight.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios.js";
import { useAuth } from "../../hooks/useAuth.js";

// ── Constants ──────────────────────────────────────────────────────────────────
const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Other",
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ── Initial form state ─────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name:     "",
  email:    "",
  password: "",
  branch:   "",
  semester: "",
};

// ── Initial errors state ───────────────────────────────────────────────────────
const INITIAL_ERRORS = {
  name:     "",
  email:    "",
  password: "",
  branch:   "",
  semester: "",
};

// ─────────────────────────────────────────────────────────────────────────────
const SignupPage = () => {
  const navigate       = useNavigate();
  const { user, login } = useAuth();

  // Navigate to /feed once login() has updated user state
  useEffect(() => {
    if (user) navigate("/feed", { replace: true });
  }, [user, navigate]);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState(INITIAL_ERRORS);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  // ── Field change handler ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the inline error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Client-side validation ────────────────────────────────────────────────────
  // Returns true if valid, false if there are errors (and sets error state).
  const validate = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Full name is required.";
      valid = false;
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
      valid = false;
    }

    if (!form.email.trim()) {
      newErrors.email = "College email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address.";
      valid = false;
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      valid = false;
    }

    if (!form.branch) {
      newErrors.branch = "Please select your branch.";
      valid = false;
    }

    if (!form.semester) {
      newErrors.semester = "Please select your semester.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── Submit handler ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Abort if client-side validation fails
    if (!validate()) return;

    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        branch:   form.branch,
        semester: Number(form.semester),
      });

      // Persist auth state globally — useEffect above will navigate to /feed
      login(data.user, data.token);
      toast.success("Welcome to Lynqo! 🎉");
    } catch (err) {
      // Extract the server's error message (or fall back gracefully)
      const message =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    /*
     * Outer shell:
     *  - Mobile: zinc-950 full-screen, top-padded.
     *  - sm+: same zinc-950 background; card visually lifts.
     */
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center px-6 py-8 sm:px-4">

      {/*
       * Card wrapper:
       *  - Mobile: no card — transparent, no shadow.
       *  - sm+: centered zinc-900 card with shadow.
       */}
      <div className="w-full sm:max-w-md sm:mx-auto sm:bg-zinc-900 sm:rounded-2xl sm:shadow-lg sm:shadow-black/30 sm:border sm:border-zinc-800 sm:p-8 md:p-10">

        {/* ── Branding ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Logo wordmark */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white mb-3">
            <span className="text-black text-xl font-bold tracking-tight">L</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Create your account</h1>
          <p className="mt-1 text-sm text-zinc-400">Join your campus community on Lynqo</p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Full Name */}
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Arjun Mehta"
              autoComplete="name"
              aria-describedby={errors.name ? "signup-name-error" : undefined}
              className={`input-field h-12 ${
                errors.name
                  ? "border-red-400 focus:ring-red-400"
                  : "focus:ring-white"
              }`}
            />
            {errors.name && (
              <p id="signup-name-error" className="mt-1.5 text-xs text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* College Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              College Email
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@college.edu"
              autoComplete="email"
              inputMode="email"
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              className={`input-field h-12 ${
                errors.email
                  ? "border-red-400 focus:ring-red-400"
                  : "focus:ring-white"
              }`}
            />
            {errors.email && (
              <p id="signup-email-error" className="mt-1.5 text-xs text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Password
            </label>
            {/*
             * Relative wrapper so the eye icon is positioned inside the input.
             * The icon's button has min-h-[44px] and w-[44px] for touch compliance.
             */}
            <div className="relative">
              <input
                id="signup-password"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                aria-describedby={errors.password ? "signup-password-error" : undefined}
                className={`input-field h-12 pr-12 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-400"
                    : "focus:ring-white"
                }`}
              />
              {/* Eye toggle — 44px touch zone, absolutely anchored to the right */}
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center
                           text-zinc-500 hover:text-zinc-300 transition-colors
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400
                           rounded-r-lg min-h-[44px]"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p id="signup-password-error" className="mt-1.5 text-xs text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label
              htmlFor="signup-branch"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Branch
            </label>
            <select
              id="signup-branch"
              name="branch"
              value={form.branch}
              onChange={handleChange}
              aria-describedby={errors.branch ? "signup-branch-error" : undefined}
              className={`input-field h-12 ${
                errors.branch
                  ? "border-red-400 focus:ring-red-400"
                  : "focus:ring-white"
              } ${!form.branch ? "text-zinc-500" : "text-zinc-50"}`}
            >
              <option value="" disabled>
                Select your branch
              </option>
              {BRANCHES.map((b) => (
                <option key={b} value={b} className="text-zinc-50">
                  {b}
                </option>
              ))}
            </select>
            {errors.branch && (
              <p id="signup-branch-error" className="mt-1.5 text-xs text-red-500">
                {errors.branch}
              </p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label
              htmlFor="signup-semester"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Semester
            </label>
            <select
              id="signup-semester"
              name="semester"
              value={form.semester}
              onChange={handleChange}
              aria-describedby={errors.semester ? "signup-semester-error" : undefined}
              className={`input-field h-12 ${
                errors.semester
                  ? "border-red-400 focus:ring-red-400"
                  : "focus:ring-white"
              } ${!form.semester ? "text-zinc-500" : "text-zinc-50"}`}
            >
              <option value="" disabled>
                Select your semester
              </option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s} className="text-zinc-50">
                  Semester {s}
                </option>
              ))}
            </select>
            {errors.semester && (
              <p id="signup-semester-error" className="mt-1.5 text-xs text-red-500">
                {errors.semester}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 mt-2 rounded-xl text-base font-semibold
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Creating account…</span>
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* ── Footer link ───────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link
            to="/login"
            id="signup-login-link"
            className="font-semibold text-zinc-300 hover:text-white underline-offset-2
                       hover:underline transition-colors min-h-[44px] inline-flex items-center"
          >
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SignupPage;
