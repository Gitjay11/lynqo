/**
 * LoginPage.jsx — User Login Page
 *
 * Layout rules (mobile-first — identical to SignupPage):
 *  - Mobile (default / < 640px): Full-screen form. No card. Logo at top center.
 *    px-6 py-8 padding. All inputs full-width, h-12. Button full-width, h-12.
 *  - sm: (640px+): White card — max-w-md mx-auto rounded-2xl shadow-md p-8.
 *    Page background becomes gray-100.
 *  - md: and above: Same card, page background stays gray-100.
 *
 * Behavior:
 *  - Client-side validation fires on submit (not on each keystroke).
 *  - Field-level inline errors shown below each input.
 *  - On valid submit → POST /api/auth/login.
 *  - On success   → login(user, token) from AuthContext → navigate to /.
 *  - On API error → show error toast with the server message.
 *  - Submit button disabled + spinner while request is in flight.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios.js";
import { useAuth } from "../../hooks/useAuth.js";

// ── Initial form state ─────────────────────────────────────────────────────────
const INITIAL_FORM = {
  email:    "",
  password: "",
};

// ── Initial errors state ───────────────────────────────────────────────────────
const INITIAL_ERRORS = {
  email:    "",
  password: "",
};

// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate  = useNavigate();
  const { login } = useAuth();

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
      const { data } = await api.post("/auth/login", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      // Persist auth state globally and redirect to feed
      login(data.user, data.token);
      toast.success("Welcome back! 👋");
      navigate("/");
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
     *  - Mobile: white full-screen, vertically centered.
     *  - sm+: gray-100 background to visually lift the card.
     */
    <div className="min-h-screen bg-white sm:bg-gray-100 flex flex-col justify-center px-6 py-8 sm:px-4">

      {/*
       * Card wrapper:
       *  - Mobile: no card — transparent, no shadow.
       *  - sm+: centered white card with shadow.
       */}
      <div className="w-full sm:max-w-md sm:mx-auto sm:bg-white sm:rounded-2xl sm:shadow-md sm:p-8 md:p-10">

        {/* ── Branding ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          {/* Logo icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 mb-3">
            <span className="text-white text-xl font-bold tracking-tight">L</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Log in to your Lynqo account</p>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* College Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              College Email
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@college.edu"
              autoComplete="email"
              inputMode="email"
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`input-field h-12 ${
                errors.email
                  ? "border-red-400 focus:ring-red-400"
                  : "focus:ring-brand-400"
              }`}
            />
            {errors.email && (
              <p id="login-email-error" className="mt-1.5 text-xs text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            {/*
             * Relative wrapper so the eye icon is absolutely positioned inside
             * the input field. The icon button has a 44px minimum tap zone.
             */}
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className={`input-field h-12 pr-12 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-400"
                    : "focus:ring-brand-400"
                }`}
              />
              {/* Eye toggle — 44px touch zone, anchored to the right of the input */}
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center
                           text-gray-400 hover:text-gray-600 transition-colors
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                           rounded-r-lg min-h-[44px]"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="mt-1.5 text-xs text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-12 mt-2 rounded-xl text-base font-semibold
                       bg-brand-600 hover:bg-brand-700 active:bg-brand-700
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-all duration-200"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Logging in…</span>
              </>
            ) : (
              "Log in"
            )}
          </button>
        </form>

        {/* ── Footer link ───────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            id="login-signup-link"
            className="font-semibold text-brand-600 hover:text-brand-700 underline-offset-2
                       hover:underline transition-colors min-h-[44px] inline-flex items-center"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;
