/**
 * ProfilePage.jsx — Full structured profile page
 *
 * Sections (in order):
 *  1. Profile Header   — avatar, name, branch/semester, bio, completion bar, follow/edit
 *  2. Personal Info    — phone, email (RO), gender, DOB
 *  3. Academic Info    — branch, semester, year of joining, roll number
 *  4. Campus Life      — hostel/day, clubs
 *  5. Skills & Interests — skills tags, hobbies tags, looking-for chips
 *  6. Social Links     — github, linkedin, instagram
 *
 * Own profile  → Edit Profile button, completion bar, avatar upload
 * Other profile → read-only, no bar, no edit button
 *
 * Route: /profile/:id  (protected)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams }          from "react-router-dom";
import toast                  from "react-hot-toast";
import {
  Pencil, Camera, Check, X, Loader2,
  BookOpen, GraduationCap, User2,
  Building2, Zap, ExternalLink, Link2, Globe,
} from "lucide-react";

import api             from "../api/axios.js";
import { useAuth }     from "../hooks/useAuth.js";
import Avatar          from "../components/common/Avatar.jsx";
import FollowListModal from "../components/profile/FollowListModal.jsx";
import ProfileEditModal from "../components/profile/ProfileEditModal.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const LOOKING_FOR_CHIPS = [
  "Study Partner","Project Collab","Hackathon Team","Friends","Networking",
];

/**
 * Optional fields used to calculate profile completion %.
 * name & email are always filled — excluded from calculation.
 */
const OPTIONAL_FIELDS = [
  "phone","gender","dateOfBirth","yearOfJoining","rollNumber",
  "hostelOrDay","clubs","bio","github","linkedin","instagram",
];
const OPTIONAL_ARRAYS = ["skills","hobbies","lookingFor"];

function calcCompletion(profile) {
  if (!profile) return 0;
  let filled = 0;
  const total = OPTIONAL_FIELDS.length + OPTIONAL_ARRAYS.length;
  OPTIONAL_FIELDS.forEach((f) => { if (profile[f]) filled++; });
  OPTIONAL_ARRAYS.forEach((f) => { if ((profile[f] ?? []).length > 0) filled++; });
  return Math.round((filled / total) * 100);
}

// ── Small display helpers ──────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, children }) => (
  <div
    className="rounded-2xl p-5 mb-4"
    style={{
      backgroundColor: "var(--bg-surface)",
      border: "1px solid var(--border)",
    }}
  >
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className="rounded-lg p-1.5 flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-elevated)" }}
      >
        <Icon size={15} style={{ color: "var(--text-secondary)" }} />
      </span>
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
    </div>
    {children}
  </div>
);

const FieldBox = ({ label, value, href }) => {
  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <p
        className="text-[10px] font-medium uppercase tracking-wide mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      {isEmpty ? (
        <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not set</p>
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm flex items-center gap-1 transition-colors break-all"
          style={{ color: "var(--text-primary)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-primary)"}
        >
          {value}
          <ExternalLink size={11} className="flex-shrink-0" />
        </a>
      ) : (
        <p className="text-sm break-words" style={{ color: "var(--text-primary)" }}>{value}</p>
      )}
    </div>
  );
};

const TagChips = ({ items }) => (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {items.length === 0
      ? <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not set</p>
      : items.map((t, i) => (
          <span
            key={i}
            className="px-2.5 py-1 text-xs rounded-full"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {t}
          </span>
        ))
    }
  </div>
);

const LookingForDisplay = ({ items }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {LOOKING_FOR_CHIPS.map((chip) => (
      <span
        key={chip}
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={
          items.includes(chip)
            ? { backgroundColor: "var(--accent)", color: "#ffffff", border: "1px solid var(--accent)" }
            : { backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }
        }
      >
        {chip}
      </span>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { id }               = useParams();
  const { user, updateUser } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const [isEditing,  setIsEditing]  = useState(false);
  const [formData,   setFormData]   = useState({});
  const [saving,     setSaving]     = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("followers");

  const isOwnProfile = profile &&
    (profile.id === user?._id || profile.id === user?.id);

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      try {
        const { data } = await api.get(`/users/${id}`);
        setProfile(data.user);
        setIsFollowing(data.user.isFollowing ?? false);
      } catch (err) {
        toast.error(err.response?.data?.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [id]);

  // ── Follow / Unfollow ────────────────────────────────────────────────────
  const handleFollowToggle = useCallback(async () => {
    if (followLoading) return;
    const wasFollowing = isFollowing;
    const prevCount    = profile?.followerCount ?? 0;
    setIsFollowing(!wasFollowing);
    setProfile((p) => p ? { ...p, followerCount: wasFollowing ? Math.max(0, prevCount - 1) : prevCount + 1 } : p);
    setFollowLoading(true);
    try {
      await api.put(`/users/${id}/${wasFollowing ? "unfollow" : "follow"}`);
    } catch (err) {
      setIsFollowing(wasFollowing);
      setProfile((p) => p ? { ...p, followerCount: prevCount } : p);
      toast.error(err.response?.data?.message ?? "Action failed.");
    } finally {
      setFollowLoading(false);
    }
  }, [followLoading, isFollowing, profile, id]);

  const openModal = useCallback((type) => { setModalType(type); setModalOpen(true); }, []);

  // ── Edit helpers ─────────────────────────────────────────────────────────
  const enterEditMode = useCallback(() => {
    setFormData({
      name: profile.name ?? "", branch: profile.branch ?? "",
      semester: profile.semester ?? "", bio: profile.bio ?? "",
      phone: profile.phone ?? "", gender: profile.gender ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      yearOfJoining: profile.yearOfJoining ?? "",
      rollNumber: profile.rollNumber ?? "",
      hostelOrDay: profile.hostelOrDay ?? "",
      clubs: profile.clubs ?? "",
      skills: profile.skills ?? [], hobbies: profile.hobbies ?? [],
      lookingFor: profile.lookingFor ?? [],
      github: profile.github ?? "",
      linkedin: profile.linkedin ?? "",
      instagram: profile.instagram ?? "",
    });
    setIsEditing(true);
  }, [profile]);

  const handleFieldChange = useCallback((field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }, []);

  const handleSave = async () => {
    if (!formData.name?.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      const payload = {
        name:          formData.name.trim(),
        branch:        formData.branch,
        semester:      formData.semester ? Number(formData.semester) : undefined,
        bio:           formData.bio.trim(),
        phone:         formData.phone,
        gender:        formData.gender,
        dateOfBirth:   formData.dateOfBirth || null,
        yearOfJoining: formData.yearOfJoining || null,
        rollNumber:    formData.rollNumber,
        hostelOrDay:   formData.hostelOrDay,
        clubs:         formData.clubs,
        skills:        formData.skills,
        hobbies:       formData.hobbies,
        lookingFor:    formData.lookingFor,
        github:        formData.github,
        linkedin:      formData.linkedin,
        instagram:     formData.instagram,
      };
      const { data } = await api.put("/users/update", payload);
      setProfile((prev) => ({ ...prev, ...data.user }));
      updateUser(data.user);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar helpers ───────────────────────────────────────────────────────
  const handleAvatarClick  = () => { if (isOwnProfile) fileInputRef.current?.click(); };
  const handleAvatarCancel = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null); setAvatarFile(null);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed."); e.target.value = ""; return; }
    if (file.size > MAX_AVATAR_BYTES)    { toast.error("Image must be under 2 MB.");     e.target.value = ""; return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };
  const handleAvatarConfirm = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const { data } = await api.put("/users/upload-avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, profilePicture: data.user.profilePicture }));
      updateUser({ profilePicture: data.user.profilePicture });
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null); setAvatarFile(null);
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen py-6 px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-full max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="rounded-2xl p-5 h-48" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
          <div className="rounded-2xl p-5 h-40" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
          <div className="rounded-2xl p-5 h-40" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center">
          <p className="text-5xl mb-4">👤</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>User not found</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const displaySrc   = avatarPreview ?? profile.profilePicture ?? null;
  const completion   = calcCompletion(profile);
  const dob          = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
    : "";

  return (
    <div className="min-h-screen py-6 px-4 pb-10" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="w-full max-w-3xl mx-auto">

        {/* ── SECTION 1: Profile Header ─────────────────────────────────── */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >

          {/* Top row: avatar + name/meta + edit button */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <Avatar src={displaySrc} name={profile.name} size="xl" />
                {isOwnProfile && !avatarPreview && (
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-200">
                    <Camera size={20} className="text-white" />
                    <span className="text-white text-[10px] font-medium">Change</span>
                  </div>
                )}
              </div>
              {isOwnProfile && !avatarPreview && (
                <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>Tap to change</p>
              )}
              {avatarPreview && (
                <div className="flex gap-2 mt-1">
                  <button id="avatar-confirm-btn" onClick={handleAvatarConfirm} disabled={uploading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg min-h-[36px] disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
                  >
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                    {uploading ? "Uploading…" : "Confirm"}
                  </button>
                  <button id="avatar-cancel-btn" onClick={handleAvatarCancel} disabled={uploading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg min-h-[36px] disabled:opacity-50 transition-colors"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <X size={12} strokeWidth={2.5} /> Cancel
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*"
                className="hidden" onChange={handleFileSelect} aria-hidden="true" />
            </div>

            {/* Name + meta + actions */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold leading-tight break-words" style={{ color: "var(--text-primary)" }}>{profile.name}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {profile.branch && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <BookOpen size={13} className="flex-shrink-0" /> {profile.branch}
                      </span>
                    )}
                    {profile.semester && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <GraduationCap size={13} className="flex-shrink-0" /> Semester {profile.semester}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit / Follow buttons */}
                {isOwnProfile ? (
                  <button id="edit-profile-btn" onClick={enterEditMode}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] flex-shrink-0"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    <Pencil size={14} strokeWidth={2} /> Edit Profile
                  </button>
                ) : (
                  <button id="follow-toggle-btn" onClick={handleFollowToggle} disabled={followLoading}
                    aria-label={isFollowing ? "Unfollow user" : "Follow user"}
                    className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold min-h-[44px] flex-shrink-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={
                      isFollowing
                        ? { border: "1px solid var(--border)", color: "var(--text-primary)", backgroundColor: "transparent" }
                        : { backgroundColor: "var(--accent)", color: "#ffffff", border: "1px solid var(--accent)" }
                    }
                    onMouseEnter={e => {
                      if (isFollowing) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                      else e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                    }}
                    onMouseLeave={e => {
                      if (isFollowing) e.currentTarget.style.backgroundColor = "transparent";
                      else e.currentTarget.style.backgroundColor = "var(--accent)";
                    }}
                  >
                    {followLoading ? <Loader2 size={14} className="animate-spin" /> : (isFollowing ? "Unfollow" : "Follow")}
                  </button>
                )}
              </div>

              {/* Followers / Following stats */}
              <div className="flex items-center gap-5 mt-3">
                <button id="followers-stat-btn" onClick={() => openModal("followers")}
                  className="flex flex-col items-start group">
                  <span className="text-base font-bold transition-colors" style={{ color: "var(--text-primary)" }}>{profile.followerCount ?? 0}</span>
                  <span className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>Followers</span>
                </button>
                <div className="w-px h-7" style={{ backgroundColor: "var(--border)" }} />
                <button id="following-stat-btn" onClick={() => openModal("following")}
                  className="flex flex-col items-start group">
                  <span className="text-base font-bold transition-colors" style={{ color: "var(--text-primary)" }}>{profile.followingCount ?? 0}</span>
                  <span className="text-xs transition-colors" style={{ color: "var(--text-muted)" }}>Following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio ? (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{profile.bio}</p>
              ) : isOwnProfile ? (
                <p className="mt-3 text-sm italic" style={{ color: "var(--text-muted)" }}>Add a bio to tell people about yourself.</p>
              ) : null}

              {/* Profile completion — own profile only */}
              {isOwnProfile && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Profile completion</p>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{completion}%</p>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completion}%`, backgroundColor: "var(--accent)" }}
                    />
                  </div>
                  {completion < 100 && (
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                      Fill in more details to complete your profile.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Personal Information ──────────────────────────────── */}
        <SectionCard icon={User2} title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldBox label="Full Name"    value={profile.name} />
            <FieldBox label="Email"        value={profile.email} />
            <FieldBox label="Phone"        value={profile.phone} />
            <FieldBox label="Gender"       value={profile.gender} />
            <FieldBox label="Date of Birth" value={dob} />
          </div>
        </SectionCard>

        {/* ── SECTION 3: Academic Information ──────────────────────────────── */}
        <SectionCard icon={GraduationCap} title="Academic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldBox label="Branch / Department" value={profile.branch} />
            <FieldBox label="Semester"            value={profile.semester ? `Semester ${profile.semester}` : ""} />
            <FieldBox label="Year of Joining"     value={profile.yearOfJoining ? String(profile.yearOfJoining) : ""} />
            <FieldBox label="Roll Number"         value={profile.rollNumber} />
          </div>
        </SectionCard>

        {/* ── SECTION 4: Campus Life ────────────────────────────────────────── */}
        <SectionCard icon={Building2} title="Campus Life">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldBox label="Accommodation" value={profile.hostelOrDay} />
            <FieldBox label="Clubs / Societies" value={profile.clubs} />
          </div>
        </SectionCard>

        {/* ── SECTION 5: Skills & Interests ────────────────────────────────── */}
        <SectionCard icon={Zap} title="Skills &amp; Interests">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Skills</p>
              <TagChips items={profile.skills ?? []} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Hobbies</p>
              <TagChips items={profile.hobbies ?? []} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Looking For</p>
              <LookingForDisplay items={profile.lookingFor ?? []} />
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 6: Social Links ───────────────────────────────────────── */}
        <SectionCard icon={Link2} title="Social Links">
          <div className="space-y-3">
            {/* GitHub */}
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <Link2 size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>GitHub</p>
                {profile.github
                  ? <a href={profile.github} target="_blank" rel="noopener noreferrer"
                      className="text-sm transition-colors break-all flex items-center gap-1"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-primary)"}
                    >
                      {profile.github} <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                  : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not set</p>
                }
              </div>
            </div>
            {/* LinkedIn */}
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <Link2 size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>LinkedIn</p>
                {profile.linkedin
                  ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-sm transition-colors break-all flex items-center gap-1"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-primary)"}
                    >
                      {profile.linkedin} <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                  : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not set</p>
                }
              </div>
            </div>
            {/* Instagram */}
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              <Globe size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>Instagram</p>
                {profile.instagram
                  ? <p className="text-sm" style={{ color: "var(--text-primary)" }}>@{profile.instagram.replace(/^@/, "")}</p>
                  : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Not set</p>
                }
              </div>
            </div>
          </div>
        </SectionCard>

      </div>
      {/* ── END max-w-3xl container ─────────────────────────────────────────── */}

      {/* Follow List Modal */}
      <FollowListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "followers" ? "Followers" : "Following"}
        userId={id}
        type={modalType}
      />

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        formData={formData}
        onChange={handleFieldChange}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
};

export default ProfilePage;
