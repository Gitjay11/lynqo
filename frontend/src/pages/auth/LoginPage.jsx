/**
 * LoginPage.jsx — User Login Page (Upgraded)
 *
 * Mobile: full-screen form on bg-bg-primary, no card.
 * sm+: bg-bg-surface card, max-w-md mx-auto.
 *
 * Uses shared components: Input, Button
 */

import { useState, useEffect } from "react";
import { Link, useNavigate }   from "react-router-dom";
import { Eye, EyeOff }         from "lucide-react";
import toast                   from "react-hot-toast";

import api          from "../../api/axios.js";
import { useAuth }  from "../../hooks/useAuth.js";
import Input        from "../../components/common/Input.jsx";
import Button       from "../../components/common/Button.jsx";
import Divider      from "../../components/common/Divider.jsx";

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

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
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

  // ── Show/hide password toggle icon ────────────────────────────────────────
  const TogglePass = (
    <button
      type="button"
      onClick={() => setShowPass((p) => !p)}
      aria-label={showPass ? "Hide password" : "Show password"}
      className="
        flex items-center justify-center w-5 h-5
        text-[var(--text-muted)] hover:text-[var(--text-secondary)]
        transition-colors duration-150 focus:outline-none
      "
    >
      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col justify-center px-6 py-8 sm:px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="w-full sm:max-w-md sm:mx-auto">
        <div
          className={`
            sm:bg-bg-surface sm:border sm:border-app-border
            sm:rounded-2xl sm:shadow-lg sm:p-8 md:p-10
            w-full animate-fade-in
            ${shaking ? "animate-shake" : ""}
          `}
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
            <Input
              id="login-email"
              type="email"
              label="College Email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="you@college.edu"
              error={errors.email}
              autoComplete="email"
              inputMode="email"
              required
            />

            {/* Password */}
            <Input
              id="login-password"
              type={showPass ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Enter your password"
              error={errors.password}
              autoComplete="current-password"
              iconRight={TogglePass}
              required
            />

            {/* Submit */}
            <Button
              id="login-submit"
              type="submit"
              variant="primary"
              size="full"
              loading={loading}
              className="mt-2 h-12 text-base"
            >
              Log in
            </Button>
          </form>

          {/* ── Divider ──────────────────────────────────────────────────────── */}
          <div className="mt-6">
            <Divider />
          </div>

          {/* ── Footer link ──────────────────────────────────────────────────── */}
          <p className="mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              id="login-signup-link"
              className="font-bold underline-offset-2 hover:underline transition-colors"
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
