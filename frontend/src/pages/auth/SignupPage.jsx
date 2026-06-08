/**
 * SignupPage.jsx — User Registration Page (Themed)
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

const BRANCHES = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Other"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const INITIAL_FORM   = { name: "", email: "", password: "", branch: "", semester: "" };
const INITIAL_ERRORS = { name: "", email: "", password: "", branch: "", semester: "" };

// ─────────────────────────────────────────────────────────────────────────────
const SignupPage = () => {
  const navigate        = useNavigate();
  const { user, login } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed", { replace: true });
  }, [user, navigate]);

  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState(INITIAL_ERRORS);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.name.trim())               { newErrors.name     = "Full name is required.";                   valid = false; }
    else if (form.name.trim().length < 2){ newErrors.name     = "Name must be at least 2 characters.";      valid = false; }

    if (!form.email.trim())              { newErrors.email    = "College email is required.";                valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address."; valid = false;
    }

    if (!form.password)                  { newErrors.password = "Password is required.";                    valid = false; }
    else if (form.password.length < 6)   { newErrors.password = "Password must be at least 6 characters."; valid = false; }

    if (!form.branch)                    { newErrors.branch   = "Please select your branch.";               valid = false; }
    if (!form.semester)                  { newErrors.semester = "Please select your semester.";             valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      login(data.user, data.token);
      toast.success("Welcome to Lynqo! 🎉");
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
      <div className="w-full sm:max-w-md sm:mx-auto">
        <div className="sm:bg-bg-surface sm:border sm:border-app-border sm:rounded-2xl sm:shadow-lg sm:p-8 md:p-10 w-full">

          {/* ── Branding ───────────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <span className="text-white text-xl font-bold tracking-tight">L</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Create your account</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Join your campus community on Lynqo</p>
          </div>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Full Name
              </label>
              <input
                id="signup-name" type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Arjun Mehta" autoComplete="name"
                aria-describedby={errors.name ? "signup-name-error" : undefined}
                className={`input-field h-12 ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.name && <p id="signup-name-error" className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                College Email
              </label>
              <input
                id="signup-email" type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="you@college.edu" autoComplete="email" inputMode="email"
                aria-describedby={errors.email ? "signup-email-error" : undefined}
                className={`input-field h-12 ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {errors.email && <p id="signup-email-error" className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password" type={showPass ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters" autoComplete="new-password"
                  aria-describedby={errors.password ? "signup-password-error" : undefined}
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
              {errors.password && <p id="signup-password-error" className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Branch */}
            <div>
              <label htmlFor="signup-branch" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Branch
              </label>
              <select
                id="signup-branch" name="branch" value={form.branch} onChange={handleChange}
                aria-describedby={errors.branch ? "signup-branch-error" : undefined}
                className={`input-field h-12 ${errors.branch ? "border-red-400 focus:ring-red-400" : ""}`}
                style={{ color: !form.branch ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                <option value="" disabled>Select your branch</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.branch && <p id="signup-branch-error" className="mt-1.5 text-xs text-red-500">{errors.branch}</p>}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="signup-semester" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Semester
              </label>
              <select
                id="signup-semester" name="semester" value={form.semester} onChange={handleChange}
                aria-describedby={errors.semester ? "signup-semester-error" : undefined}
                className={`input-field h-12 ${errors.semester ? "border-red-400 focus:ring-red-400" : ""}`}
                style={{ color: !form.semester ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                <option value="" disabled>Select your semester</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
              {errors.semester && <p id="signup-semester-error" className="mt-1.5 text-xs text-red-500">{errors.semester}</p>}
            </div>

            {/* Submit */}
            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 mt-2 rounded-xl text-base font-semibold
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  <span>Creating account…</span>
                </>
              ) : "Create account"}
            </button>
          </form>

          {/* ── Footer link ──────────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              id="signup-login-link"
              className="font-semibold underline-offset-2 hover:underline transition-colors min-h-[44px] inline-flex items-center"
              style={{ color: "var(--accent)" }}
            >
              Log in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
