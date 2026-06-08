/**
 * ProfileEditModal.jsx — Full Profile Edit Modal (Redesigned)
 *
 * Mobile:  slides up from bottom — rounded-t-2xl, fixed inset-x-0 bottom-0
 * Desktop: centered dialog — fixed inset-0 flex items-center justify-center
 *
 * Sections (all in one scrollable modal, unchanged logic):
 *   Core Info → Personal → Academic → Campus Life → Skills & Interests → Social Links
 *
 * All API calls and data-flow logic are unchanged.
 * Only visual improvements: typography, input styles, footer buttons, animation.
 */

import { X, Loader2, Check } from "lucide-react";
import TagInput from "./TagInput.jsx";

const BRANCH_OPTIONS    = ["CSE","IT","ECE","EEE","ME","CE","Chemical","Biotech","MCA","MBA"];
const SEMESTER_OPTIONS  = [1,2,3,4,5,6,7,8];
const LOOKING_FOR_CHIPS = ["Study Partner","Project Collab","Hackathon Team","Friends","Networking"];
const GENDER_OPTIONS    = ["","Male","Female","Prefer not to say"];
const HOSTEL_OPTIONS    = ["","Hostel","Day Scholar"];

// ── Section divider label ─────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p
    className="text-[9px] font-bold uppercase tracking-widest mb-3"
    style={{ color: "var(--text-muted)" }}
  >
    {children}
  </p>
);

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="text-[9px] font-bold uppercase tracking-widest block"
      style={{ color: "var(--text-muted)" }}
    >
      {label}
    </label>
    {children}
  </div>
);

// ── Shared input class builder ────────────────────────────────────────────────
const inputStyle = {
  backgroundColor: "var(--bg-elevated)",
  border:          "1px solid var(--border)",
  color:           "var(--text-primary)",
};

const InputField = ({ id, value, onChange, placeholder, maxLength, type = "text", ...rest }) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    maxLength={maxLength}
    className="
      w-full px-4 py-2.5 rounded-xl text-sm
      outline-none transition-colors duration-150
      placeholder:text-[color:var(--text-muted)]
    "
    style={inputStyle}
    onFocus={e  => e.currentTarget.style.borderColor = "var(--accent)"}
    onBlur={e   => e.currentTarget.style.borderColor = "var(--border)"}
    {...rest}
  />
);

const SelectField = ({ id, value, onChange, children }) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-colors duration-150"
    style={inputStyle}
    onFocus={e  => e.currentTarget.style.borderColor = "var(--accent)"}
    onBlur={e   => e.currentTarget.style.borderColor = "var(--border)"}
  >
    {children}
  </select>
);

// ─────────────────────────────────────────────────────────────────────────────
const ProfileEditModal = ({ isOpen, onClose, formData, onChange, onSave, saving }) => {
  if (!isOpen) return null;

  const set = (field) => (e) => onChange(field, e.target.value);

  const toggleLookingFor = (chip) => {
    const current = formData.lookingFor ?? [];
    const next    = current.includes(chip)
      ? current.filter((c) => c !== chip)
      : [...current, chip];
    onChange("lookingFor", next);
  };

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal shell — bottom-sheet on mobile, centered on sm+ ─────────── */}
      <div
        className="
          fixed inset-x-0 bottom-0 z-50
          sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4
        "
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
      >
        <div
          className="
            relative w-full sm:max-w-2xl
            max-h-[92dvh]
            rounded-t-2xl sm:rounded-2xl
            flex flex-col overflow-hidden
            animate-fade-in
          "
          style={{
            backgroundColor: "var(--bg-surface)",
            border:          "1px solid var(--border)",
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Edit Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close edit modal"
              className="
                flex items-center justify-center
                w-8 h-8 rounded-lg min-h-0
                transition-colors duration-150
                focus:outline-none
              "
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                e.currentTarget.style.color           = "var(--text-primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color           = "var(--text-secondary)";
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Scrollable body ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

            {/* Core Info */}
            <section>
              <SectionLabel>Core Info</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Name">
                  <InputField
                    id="edit-name"
                    value={formData.name ?? ""}
                    onChange={set("name")}
                    placeholder="Your full name"
                    maxLength={50}
                  />
                </Field>
                <Field label="Branch">
                  <SelectField id="edit-branch" value={formData.branch ?? ""} onChange={set("branch")}>
                    <option value="">Select branch</option>
                    {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </SelectField>
                </Field>
                <Field label="Semester">
                  <SelectField id="edit-semester" value={formData.semester ?? ""} onChange={set("semester")}>
                    <option value="">Select semester</option>
                    {SEMESTER_OPTIONS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </SelectField>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Bio (optional)">
                  <textarea
                    id="edit-bio"
                    value={formData.bio ?? ""}
                    onChange={set("bio")}
                    placeholder="Tell people about yourself…"
                    maxLength={160}
                    rows={3}
                    className="
                      w-full px-4 py-2.5 rounded-xl text-sm resize-none
                      outline-none transition-colors duration-150
                      placeholder:text-[color:var(--text-muted)]
                    "
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onBlur={e  => e.currentTarget.style.borderColor = "var(--border)"}
                  />
                  <p className="text-xs text-right mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {(formData.bio ?? "").length}/160
                  </p>
                </Field>
              </div>
            </section>

            {/* Personal Information */}
            <section>
              <SectionLabel>Personal Information</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Phone (optional)">
                  <InputField
                    id="edit-phone"
                    value={formData.phone ?? ""}
                    onChange={set("phone")}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </Field>
                <Field label="Gender (optional)">
                  <SelectField id="edit-gender" value={formData.gender ?? ""} onChange={set("gender")}>
                    {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g || "Select gender"}</option>)}
                  </SelectField>
                </Field>
                <Field label="Date of Birth (optional)">
                  <InputField
                    id="edit-dob"
                    type="date"
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split("T")[0] : ""}
                    onChange={set("dateOfBirth")}
                  />
                </Field>
              </div>
            </section>

            {/* Academic Information */}
            <section>
              <SectionLabel>Academic Information</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Year of Joining (optional)">
                  <InputField
                    id="edit-year"
                    type="number"
                    value={formData.yearOfJoining ?? ""}
                    onChange={set("yearOfJoining")}
                    placeholder="e.g. 2023"
                    min={2000}
                    max={new Date().getFullYear() + 1}
                  />
                </Field>
                <Field label="Roll Number (optional)">
                  <InputField
                    id="edit-roll"
                    value={formData.rollNumber ?? ""}
                    onChange={set("rollNumber")}
                    placeholder="e.g. 21CS001"
                  />
                </Field>
              </div>
            </section>

            {/* Campus Life */}
            <section>
              <SectionLabel>Campus Life</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Hostel / Day Scholar">
                  <SelectField id="edit-hostel" value={formData.hostelOrDay ?? ""} onChange={set("hostelOrDay")}>
                    {HOSTEL_OPTIONS.map((h) => <option key={h} value={h}>{h || "Not set"}</option>)}
                  </SelectField>
                </Field>
                <Field label="Clubs / Societies (optional)">
                  <InputField
                    id="edit-clubs"
                    value={formData.clubs ?? ""}
                    onChange={set("clubs")}
                    placeholder="e.g. Coding Club, NSS"
                  />
                </Field>
              </div>
            </section>

            {/* Skills & Interests */}
            <section>
              <SectionLabel>Skills &amp; Interests</SectionLabel>
              <div className="space-y-3">
                <Field label="Skills (press Enter to add)">
                  <TagInput
                    id="edit-skills"
                    tags={formData.skills ?? []}
                    onChange={(val) => onChange("skills", val)}
                    placeholder="e.g. React, Python, Figma…"
                  />
                </Field>
                <Field label="Hobbies (press Enter to add)">
                  <TagInput
                    id="edit-hobbies"
                    tags={formData.hobbies ?? []}
                    onChange={(val) => onChange("hobbies", val)}
                    placeholder="e.g. Gaming, Cricket, Music…"
                  />
                </Field>

                {/* Looking For chips */}
                <div>
                  <p
                    className="text-[9px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Looking For
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR_CHIPS.map((chip) => {
                      const active = (formData.lookingFor ?? []).includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleLookingFor(chip)}
                          className="
                            px-3 py-1.5 rounded-full text-xs font-bold
                            transition-all duration-150
                            active:scale-95
                            min-h-[36px] focus:outline-none
                          "
                          style={active
                            ? { backgroundColor: "var(--accent-light)", border: "1px solid var(--accent-border)", color: "#9a3412" }
                            : { backgroundColor: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)" }
                          }
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Social Links */}
            <section>
              <SectionLabel>Social Links</SectionLabel>
              <div className="space-y-3">
                <Field label="GitHub URL">
                  <InputField
                    id="edit-github"
                    value={formData.github ?? ""}
                    onChange={set("github")}
                    placeholder="https://github.com/username"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <InputField
                    id="edit-linkedin"
                    value={formData.linkedin ?? ""}
                    onChange={set("linkedin")}
                    placeholder="https://linkedin.com/in/username"
                  />
                </Field>
                <Field label="Instagram Handle">
                  <InputField
                    id="edit-instagram"
                    value={formData.instagram ?? ""}
                    onChange={set("instagram")}
                    placeholder="@username"
                  />
                </Field>
              </div>
            </section>

          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div
            className="flex gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                flex-1 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150 active:scale-95
                min-h-[44px] focus:outline-none
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              Cancel
            </button>
            <button
              id="edit-save-btn"
              type="button"
              onClick={onSave}
              disabled={saving}
              className="
                flex-1 flex items-center justify-center gap-2
                py-2.5 rounded-xl text-sm font-bold text-white
                transition-all duration-150 active:scale-95
                min-h-[44px] focus:outline-none
                disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
              "
              style={{ backgroundColor: "var(--accent)" }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#d4572f"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--accent)"; }}
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Check size={14} strokeWidth={2.5} /> Save Changes</>
              }
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProfileEditModal;
