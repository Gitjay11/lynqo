/**
 * SignupPage.jsx — User Registration Page (Upgraded)
 *
 * Mobile: full-screen form on bg-bg-primary, no card.
 * sm+: bg-bg-surface card, max-w-md mx-auto.
 *
 * Uses shared components: Input, Button, Divider
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

const BRANCHES  = ["Computer Science","Information Technology","Electronics","Mechanical","Civil","Other"];
const SEMESTERS = [1,2,3,4,5,6,7,8];

const INITIAL_FORM   = { name: "", email: "", password: "", branch: "", semester: "" };
const INITIAL_ERRORS = { name: "", email: "", password: "", branch: "", semester: "" };

// ── Shared select style (no Input component for <select>) ─────────────────────
const selectStyle = {
  backgroundColor: "var(--bg-elevated)",
  border:          "1px solid var(--border)",
  color:           "var(--text-primary)",
};

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
  const [shaking, setShaking]   = useState(false);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // For <select> which uses native onChange event
  const handleNativeChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;

    if (!form.name.trim())                { newErrors.name     = "Full name is required.";                   valid = false; }
    else if (form.name.trim().length < 2) { newErrors.name     = "Name must be at least 2 characters.";      valid = false; }

    if (!form.email.trim())               { newErrors.email    = "College email is required.";                valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address."; valid = false;
    }

    if (!form.password)                   { newErrors.password = "Password is required.";                    valid = false; }
    else if (form.password.length < 6)    { newErrors.password = "Password must be at least 6 characters."; valid = false; }

    if (!form.branch)                     { newErrors.branch   = "Please select your branch.";               valid = false; }
    if (!form.semester)                   { newErrors.semester = "Please select your semester.";             valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { shake(); return; }
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

          {/* ── Branding ───────────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <span className="text-white text-xl font-bold tracking-tight">L</span>
            </div>
            <h1 className="text-2xl font-bold font-display tracking-snug" style={{ color: "var(--text-primary)" }}>Create your account</h1>
            <p className="mt-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>Join your campus community on Lynqo</p>
          </div>

          {/* ── Form ─────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <Input
              id="signup-name"
              type="text"
              label="Full Name"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="e.g. Arjun Mehta"
              error={errors.name}
              autoComplete="name"
              required
            />

            {/* Email */}
            <Input
              id="signup-email"
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
              id="signup-password"
              type={showPass ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Min. 6 characters"
              error={errors.password}
              autoComplete="new-password"
              iconRight={TogglePass}
              required
            />

            {/* Branch — <select> (not wrapping in Input since we need a <select>) */}
            <div>
              <label htmlFor="signup-branch" className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Branch <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <select
                id="signup-branch"
                name="branch"
                value={form.branch}
                onChange={handleNativeChange}
                aria-describedby={errors.branch ? "signup-branch-error" : undefined}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors duration-150 border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                style={{ backgroundColor: "var(--bg-elevated)", color: !form.branch ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                <option value="" disabled>Select your branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && (
                <p id="signup-branch-error" className="font-sans font-medium text-xs text-red-500 mt-1" role="alert">
                  {errors.branch}
                </p>
              )}
            </div>

            {/* Semester */}
            <div>
              <label htmlFor="signup-semester" className="font-sans font-bold text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Semester <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <select
                id="signup-semester"
                name="semester"
                value={form.semester}
                onChange={handleNativeChange}
                aria-describedby={errors.semester ? "signup-semester-error" : undefined}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors duration-150 border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                style={{ backgroundColor: "var(--bg-elevated)", color: !form.semester ? "var(--text-muted)" : "var(--text-primary)" }}
              >
                <option value="" disabled>Select your semester</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              {errors.semester && (
                <p id="signup-semester-error" className="font-sans font-medium text-xs text-red-500 mt-1" role="alert">
                  {errors.semester}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              id="signup-submit"
              type="submit"
              variant="primary"
              size="full"
              loading={loading}
              className="mt-2 h-12 text-base"
            >
              Create account
            </Button>
          </form>

          {/* ── Divider ──────────────────────────────────────────────────────── */}
          <div className="mt-6">
            <Divider />
          </div>

          {/* ── Footer link ──────────────────────────────────────────────────── */}
          <p className="mt-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              id="signup-login-link"
              className="font-bold underline-offset-2 hover:underline transition-colors"
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
