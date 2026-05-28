/**
 * ProfilePage.jsx — User Profile View & Edit
 *
 * Handles three distinct modes in a single page:
 *  1. View mode  — shows any user's public profile (read-only)
 *  2. Edit mode  — inline form for the authenticated user's own profile
 *  3. Avatar upload — file picker + preview + confirm/cancel for own profile
 *
 * Route: /profile/:id  (protected via ProtectedRoute + AppLayout)
 *
 * API calls:
 *  GET /api/users/:id          → fetch profile on mount
 *  PUT /api/users/update       → save name/branch/semester/bio
 *  PUT /api/users/upload-avatar → upload avatar (multipart/form-data)
 *
 * Responsive layout:
 *  Mobile (default) : single column, avatar centered at top (xl=128px)
 *  md (768px+)      : two-column flex — avatar left, info right
 *  lg (1024px+)     : max-w-2xl mx-auto container cap (no full-width stretch)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams }                                 from "react-router-dom";
import toast                                         from "react-hot-toast";
import {
  Pencil, X, Check, Camera,
  BookOpen, GraduationCap, Loader2,
} from "lucide-react";

import api        from "../api/axios.js";
import { useAuth } from "../hooks/useAuth.js";
import Avatar     from "../components/common/Avatar.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const BRANCH_OPTIONS = [
  "CSE", "IT", "ECE", "EEE", "ME", "CE",
  "Chemical", "Biotech", "MCA", "MBA",
];

const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { id }                = useParams();
  const { user, updateUser }  = useAuth();

  // ── Profile data ──────────────────────────────────────────────────────────
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // ── Edit mode ─────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({
    name: "", branch: "", semester: "", bio: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState(null); // object URL
  const [avatarFile,    setAvatarFile]    = useState(null); // File object
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  // ── Derived: is this the authenticated user's own profile? ────────────────
  // Backend may return id as string "_id" or "id" depending on the payload
  const isOwnProfile = profile &&
    (profile.id === user?._id || profile.id === user?.id);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch profile on mount (or when :id changes)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setIsEditing(false);       // reset edit mode when navigating between profiles
      setAvatarPreview(null);
      setAvatarFile(null);

      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data.user);
      } catch (err) {
        const msg = err.response?.data?.message ?? "Failed to load profile.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // ─────────────────────────────────────────────────────────────────────────
  // Edit mode helpers
  // ─────────────────────────────────────────────────────────────────────────
  const enterEditMode = useCallback(() => {
    setFormData({
      name:     profile.name     ?? "",
      branch:   profile.branch   ?? "",
      semester: profile.semester ?? "",
      bio:      profile.bio      ?? "",
    });
    setIsEditing(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData({ name: "", branch: "", semester: "", bio: "" });
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put("/users/update", {
        name:     formData.name.trim(),
        branch:   formData.branch,
        semester: Number(formData.semester),
        bio:      formData.bio.trim(),
      });

      // Update the local profile display
      setProfile(data.user);

      // Update AuthContext so the navbar name/avatar chip updates immediately
      updateUser(data.user);

      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to save changes.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Avatar upload helpers
  // ─────────────────────────────────────────────────────────────────────────
  const handleAvatarClick = () => {
    if (!isOwnProfile) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Client-side validation ─────────────────────────────────────────────
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }

    // Revoke any previous object URL to avoid memory leaks
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    // Reset the input so the same file can be re-selected after a cancel
    e.target.value = "";
  };

  const handleAvatarCancel = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleAvatarConfirm = async () => {
    if (!avatarFile) return;

    setUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("avatar", avatarFile);

      // Override Content-Type so axios sends multipart/form-data with boundary
      const { data } = await api.put("/users/upload-avatar", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update local profile picture display
      setProfile((prev) => ({ ...prev, profilePicture: data.user.profilePicture }));

      // Update AuthContext → navbar avatar updates in real time
      updateUser({ profilePicture: data.user.profilePicture });

      // Clean up preview state
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);

      toast.success("Avatar updated!");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Avatar upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Skeleton loader — shown while profile is being fetched
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-start justify-center pt-10 px-4">
        <div className="w-full max-w-2xl">
          <div className="card animate-pulse">
            {/* Mobile skeleton: centered column */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
              {/* Avatar skeleton */}
              <div className="w-32 h-32 rounded-full bg-zinc-800 flex-shrink-0" />
              {/* Info skeleton */}
              <div className="flex-1 w-full space-y-3">
                <div className="h-6 bg-zinc-800 rounded-lg w-48 mx-auto md:mx-0" />
                <div className="h-4 bg-zinc-800 rounded-lg w-32 mx-auto md:mx-0" />
                <div className="h-4 bg-zinc-800 rounded-lg w-24 mx-auto md:mx-0" />
                <div className="h-16 bg-zinc-800 rounded-lg w-full mt-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Not found state
  // ─────────────────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">👤</p>
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">User not found</h2>
          <p className="text-sm text-zinc-400">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render — the avatar to display (preview overrides the real picture)
  // ─────────────────────────────────────────────────────────────────────────
  const displaySrc = avatarPreview ?? profile.profilePicture ?? null;

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      {/*
        Outer container:
          Mobile : full width, single column
          lg+    : max-w-2xl centered (no full-width stretch on desktop)
      */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="card">

          {/*
            Profile layout:
              Mobile : flex-col · everything centered
              md+    : flex-row · avatar left, info right
          */}
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">

            {/* ── AVATAR COLUMN ─────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">

              {/* Avatar wrapper — relative for the camera overlay */}
              <div className="relative group">
                <Avatar
                  src={displaySrc}
                  name={profile.name}
                  size="xl"
                  onClick={isOwnProfile ? handleAvatarClick : undefined}
                />

                {/*
                  Camera overlay — visible on hover when on own profile
                  and no preview is active (during preview we show confirm/cancel instead)
                */}
                {isOwnProfile && !avatarPreview && (
                  <button
                    id="avatar-upload-trigger"
                    aria-label="Change profile picture"
                    onClick={handleAvatarClick}
                    className="
                      absolute inset-0 rounded-full
                      bg-black/40 opacity-0 group-hover:opacity-100
                      flex flex-col items-center justify-center gap-1
                      transition-opacity duration-200
                      cursor-pointer
                    "
                  >
                    <Camera size={24} className="text-white" strokeWidth={2} />
                    <span className="text-white text-xs font-medium">Change</span>
                  </button>
                )}
              </div>

              {/* Hidden file input — triggered programmatically */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                aria-hidden="true"
              />

              {/* ── Avatar preview confirm / cancel ───────────────────── */}
              {avatarPreview && (
                <div className="flex items-center gap-2">
                  <button
                    id="avatar-confirm-btn"
                    onClick={handleAvatarConfirm}
                    disabled={uploading}
                    aria-label="Confirm avatar upload"
                    className="
                      flex items-center gap-1.5 px-3 py-1.5
                      bg-white hover:bg-zinc-100
                      text-black text-xs font-semibold
                      rounded-lg min-h-[36px]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-150
                    "
                  >
                    {uploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} strokeWidth={2.5} />
                    )}
                    {uploading ? "Uploading…" : "Confirm"}
                  </button>

                  <button
                    id="avatar-cancel-btn"
                    onClick={handleAvatarCancel}
                    disabled={uploading}
                    aria-label="Cancel avatar upload"
                    className="
                      flex items-center gap-1.5 px-3 py-1.5
                      border border-zinc-700 hover:border-red-500 hover:bg-red-500/10
                      text-zinc-400 hover:text-red-500 text-xs font-medium
                      rounded-lg min-h-[36px]
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors duration-150
                    "
                  >
                    <X size={14} strokeWidth={2.5} />
                    Cancel
                  </button>
                </div>
              )}

              {/* Upload hint — only on own profile, only in view mode */}
              {isOwnProfile && !avatarPreview && !isEditing && (
                <p className="text-xs text-zinc-500 text-center">
                  Tap photo to change
                </p>
              )}
            </div>

            {/* ── INFO COLUMN ───────────────────────────────────────────── */}
            <div className="flex-1 w-full">

              {/* ── VIEW MODE ─────────────────────────────────────────── */}
              {!isEditing && (
                <div className="flex flex-col items-center md:items-start gap-2">

                  {/* Name */}
                  <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">
                    {profile.name}
                  </h1>

                  {/* Branch */}
                  {profile.branch && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <BookOpen size={15} className="text-zinc-400 flex-shrink-0" />
                      <span>{profile.branch}</span>
                    </div>
                  )}

                  {/* Semester */}
                  {profile.semester && (
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <GraduationCap size={15} className="text-zinc-400 flex-shrink-0" />
                      <span>Semester {profile.semester}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {profile.bio ? (
                    <div className="mt-3 w-full">
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap text-left">
                        {profile.bio}
                      </p>
                    </div>
                  ) : (
                    isOwnProfile && (
                      <p className="text-sm text-zinc-500 italic mt-2">
                        Add a bio to tell people about yourself.
                      </p>
                    )
                  )}

                  {/* Edit Profile button — own profile only */}
                  {isOwnProfile && (
                    <button
                      id="edit-profile-btn"
                      onClick={enterEditMode}
                      className="
                        mt-4 w-full md:w-auto
                        btn-secondary flex items-center justify-center gap-2
                      "
                    >
                      <Pencil size={15} strokeWidth={2} />
                      Edit Profile
                    </button>
                  )}
                </div>
              )}

              {/* ── EDIT MODE ─────────────────────────────────────────── */}
              {isEditing && (
                <form
                  id="profile-edit-form"
                  onSubmit={handleSave}
                  className="flex flex-col gap-4"
                  noValidate
                >
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="edit-name"
                      className="block text-sm font-medium text-zinc-300 mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Your full name"
                      maxLength={60}
                      required
                      className="input-field"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <label
                      htmlFor="edit-branch"
                      className="block text-sm font-medium text-zinc-300 mb-1"
                    >
                      Branch
                    </label>
                    <select
                      id="edit-branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleFormChange}
                      className="input-field"
                    >
                      <option value="">Select branch</option>
                      {BRANCH_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Semester */}
                  <div>
                    <label
                      htmlFor="edit-semester"
                      className="block text-sm font-medium text-zinc-300 mb-1"
                    >
                      Semester
                    </label>
                    <select
                      id="edit-semester"
                      name="semester"
                      value={formData.semester}
                      onChange={handleFormChange}
                      className="input-field"
                    >
                      <option value="">Select semester</option>
                      {SEMESTER_OPTIONS.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Bio */}
                  <div>
                    <label
                      htmlFor="edit-bio"
                      className="block text-sm font-medium text-zinc-300 mb-1"
                    >
                      Bio
                      <span className="text-xs text-zinc-500 font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="edit-bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleFormChange}
                      placeholder="Tell people a bit about yourself…"
                      rows={3}
                      maxLength={300}
                      className="
                        input-field resize-none
                        min-h-[80px] leading-relaxed
                      "
                    />
                    <p className="text-xs text-zinc-500 text-right mt-0.5">
                      {formData.bio.length}/300
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-1">
                    {/* Cancel */}
                    <button
                      id="edit-cancel-btn"
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <X size={15} strokeWidth={2.5} />
                      Cancel
                    </button>

                    {/* Save */}
                    <button
                      id="edit-save-btn"
                      type="submit"
                      disabled={saving}
                      className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Check size={15} strokeWidth={2.5} />
                      )}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

            </div>
            {/* ── END INFO COLUMN ───────────────────────────────────── */}

          </div>
          {/* ── END flex layout ───────────────────────────────────────── */}

        </div>
        {/* ── END card ────────────────────────────────────────────────── */}
      </div>
      {/* ── END max-w-2xl container ─────────────────────────────────── */}
    </div>
  );
};

export default ProfilePage;
