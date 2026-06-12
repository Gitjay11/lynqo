/**
 * LoginPage.jsx — User Login Page (Themed)
 *
 * Mobile: full-screen form on bg-bg-primary, no card.
 * sm+: bg-bg-surface card, max-w-md mx-auto.
 */

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios.js";
import { useAuth } from "../../hooks/useAuth.js";

const INITIAL_FORM   = { email: "", password: "" };
const INITIAL_ERRORS = { email: "", password: "" };

// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate        = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed", { replace: true });
  }, [user, navigate]);

  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState(INITIAL_ERRORS);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [shaking, setShaking]   = useState(false);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(data.user, data.token);
      toast.success("Welcome back! 👋");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col justify-center px-6 py-8 sm:px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className={`w-full sm:max-w-md sm:mx-auto sm:rounded-2xl sm:shadow-lg sm:p-8 md:p-10 animate-fade-in ${
          shaking ? "animate-shake" : ""
        }`}
        style={{
          "--sm-bg":     "var(--bg-surface)",
          "--sm-border": "1px solid var(--border)",
        }}
      >
        {/* sm+ card background applied via inline style on a wrapper */}
        <div
          className="sm:bg-bg-surface sm:border sm:border-app-border sm:rounded-2xl sm:shadow-lg sm:p-8 md:p-10 w-full"
        >

          {/* ── Branding ─────────────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <span className="text-white text-xl font-bold tracking-tight">L</span>
            </div>
            <h1 className="text-2xl font-bold font-display tracking-snug" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
            <p className="mt-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>Log in to your Lynqo account</p>
          </div>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
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
                className={`input-field h-12 ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1.5 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
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
                  className={`input-field h-12 pr-12 ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  style={{ color: "var(--text-secondary)" }}
                  className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center
                             transition-colors focus:outline-none focus-visible:ring-2 rounded-r-xl min-h-[44px]"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="mt-1.5 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 mt-2 rounded-xl text-base font-bold tracking-wide
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  <span>Logging in…</span>
                </>
              ) : "Log in"}
            </button>
          </form>

          {/* ── Footer link ──────────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              id="login-signup-link"
              className="font-bold underline-offset-2 hover:underline transition-colors min-h-[44px] inline-flex items-center"
              style={{ color: "var(--accent)" }}
            >
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
