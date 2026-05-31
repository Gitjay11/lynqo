/**
 * ProfileEditModal.jsx — Full profile edit modal
 *
 * Opens as a full-screen overlay. Covers all 6 data sections:
 *  Personal Info, Academic Info, Campus Life, Skills & Interests, Social Links.
 * Core fields (name, branch, semester, bio) are also editable here.
 *
 * Props:
 *  isOpen   : boolean
 *  onClose  : () => void
 *  formData : object         — current form state
 *  onChange : (field, val) => void
 *  onSave   : (e) => void
 *  saving   : boolean
 */

import { X, Loader2, Check } from "lucide-react";
import TagInput from "./TagInput.jsx";

const BRANCH_OPTIONS   = ["CSE","IT","ECE","EEE","ME","CE","Chemical","Biotech","MCA","MBA"];
const SEMESTER_OPTIONS = [1,2,3,4,5,6,7,8];
const LOOKING_FOR_CHIPS = [
  "Study Partner","Project Collab","Hackathon Team","Friends","Networking",
];
const GENDER_OPTIONS    = ["","Male","Female","Prefer not to say"];
const HOSTEL_OPTIONS    = ["","Hostel","Day Scholar"];

/* ── Small reusable label + input wrapper ─────────────────────────────────── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-zinc-700 border border-zinc-600 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-500 min-h-[44px]";

/* ── Main Modal ───────────────────────────────────────────────────────────── */
const ProfileEditModal = ({ isOpen, onClose, formData, onChange, onSave, saving }) => {
  if (!isOpen) return null;

  const set = (field) => (e) => onChange(field, e.target.value);

  const toggleLookingFor = (chip) => {
    const current = formData.lookingFor ?? [];
    const next = current.includes(chip)
      ? current.filter((c) => c !== chip)
      : [...current, chip];
    onChange("lookingFor", next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-2xl max-h-[92dvh] bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            aria-label="Close edit modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* ── Core Info ──────────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Core Info
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name">
                <input id="edit-name" className={inputCls} value={formData.name ?? ""}
                  onChange={set("name")} placeholder="Your full name" maxLength={50} />
              </Field>
              <Field label="Branch">
                <select id="edit-branch" className={inputCls} value={formData.branch ?? ""} onChange={set("branch")}>
                  <option value="">Select branch</option>
                  {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select id="edit-semester" className={inputCls} value={formData.semester ?? ""} onChange={set("semester")}>
                  <option value="">Select semester</option>
                  {SEMESTER_OPTIONS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Bio (optional)">
                <textarea id="edit-bio" className={`${inputCls} resize-none`} rows={3}
                  value={formData.bio ?? ""} onChange={set("bio")}
                  placeholder="Tell people about yourself…" maxLength={160} />
                <p className="text-xs text-zinc-500 text-right">{(formData.bio ?? "").length}/160</p>
              </Field>
            </div>
          </section>

          {/* ── Personal Information ───────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Personal Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone (optional)">
                <input id="edit-phone" className={inputCls} value={formData.phone ?? ""}
                  onChange={set("phone")} placeholder="+91 XXXXX XXXXX" />
              </Field>
              <Field label="Gender (optional)">
                <select id="edit-gender" className={inputCls} value={formData.gender ?? ""} onChange={set("gender")}>
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g || "Prefer not to say"}</option>)}
                </select>
              </Field>
              <Field label="Date of Birth (optional)">
                <input id="edit-dob" type="date" className={inputCls}
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split("T")[0] : ""}
                  onChange={set("dateOfBirth")} />
              </Field>
            </div>
          </section>

          {/* ── Academic Information ───────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Academic Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Year of Joining (optional)">
                <input id="edit-year" type="number" className={inputCls}
                  value={formData.yearOfJoining ?? ""} onChange={set("yearOfJoining")}
                  placeholder="e.g. 2023" min={2000} max={new Date().getFullYear() + 1} />
              </Field>
              <Field label="Roll Number (optional)">
                <input id="edit-roll" className={inputCls} value={formData.rollNumber ?? ""}
                  onChange={set("rollNumber")} placeholder="e.g. 21CS001" />
              </Field>
            </div>
          </section>

          {/* ── Campus Life ────────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Campus Life
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Hostel / Day Scholar">
                <select id="edit-hostel" className={inputCls} value={formData.hostelOrDay ?? ""} onChange={set("hostelOrDay")}>
                  {HOSTEL_OPTIONS.map((h) => <option key={h} value={h}>{h || "Not set"}</option>)}
                </select>
              </Field>
              <Field label="Clubs / Societies (optional)">
                <input id="edit-clubs" className={inputCls} value={formData.clubs ?? ""}
                  onChange={set("clubs")} placeholder="e.g. Coding Club, NSS" />
              </Field>
            </div>
          </section>

          {/* ── Skills & Interests ─────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Skills &amp; Interests
            </p>
            <div className="space-y-3">
              <Field label="Skills (press Enter to add)">
                <TagInput id="edit-skills" tags={formData.skills ?? []}
                  onChange={(val) => onChange("skills", val)}
                  placeholder="e.g. React, Python, Figma…" />
              </Field>
              <Field label="Hobbies (press Enter to add)">
                <TagInput id="edit-hobbies" tags={formData.hobbies ?? []}
                  onChange={(val) => onChange("hobbies", val)}
                  placeholder="e.g. Gaming, Cricket, Music…" />
              </Field>
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  Looking For
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_CHIPS.map((chip) => {
                    const active = (formData.lookingFor ?? []).includes(chip);
                    return (
                      <button key={chip} type="button"
                        onClick={() => toggleLookingFor(chip)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors min-h-[36px] ${
                          active
                            ? "bg-white text-black border-white"
                            : "bg-transparent text-zinc-300 border-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Social Links ───────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Social Links
            </p>
            <div className="space-y-3">
              <Field label="GitHub URL">
                <input id="edit-github" className={inputCls} value={formData.github ?? ""}
                  onChange={set("github")} placeholder="https://github.com/username" />
              </Field>
              <Field label="LinkedIn URL">
                <input id="edit-linkedin" className={inputCls} value={formData.linkedin ?? ""}
                  onChange={set("linkedin")} placeholder="https://linkedin.com/in/username" />
              </Field>
              <Field label="Instagram Handle">
                <input id="edit-instagram" className={inputCls} value={formData.instagram ?? ""}
                  onChange={set("instagram")} placeholder="@username" />
              </Field>
            </div>
          </section>

        </div>
        {/* End scrollable body */}

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-800 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 sm:flex-none px-5 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 rounded-xl text-sm font-medium transition-colors min-h-[44px]">
            Cancel
          </button>
          <button id="edit-save-btn" type="button" onClick={onSave} disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-zinc-100 rounded-xl text-sm font-semibold transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} strokeWidth={2.5} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileEditModal;
