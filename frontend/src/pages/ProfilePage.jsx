/**
 * ProfilePage.jsx — Full Structured Profile Page (Redesigned)
 *
 * Layout (top → bottom):
 *  1. Profile Header Card — avatar, name, meta pills, bio, action buttons,
 *                            three-stat row, progress bar (own profile only)
 *  2. Academic Information
 *  3. Campus Life
 *  4. Skills & Interests
 *  5. Social Links
 *  6. Recent Posts (own profile, in sidebar on lg+)
 *
 * Desktop (lg+): two-column — main sections left, recent posts sidebar right
 * Mobile: single column, all sections stacked
 *
 * Own profile  → camera edit, Edit Profile button, completion bar, Recent Posts
 * Other profile → Follow/Unfollow + Message buttons, read-only view
 *
 * All API calls unchanged:
 *  GET  /api/users/:id
 *  PUT  /api/users/update
 *  PUT  /api/users/upload-avatar
 *  PUT  /api/users/:id/follow
 *  PUT  /api/users/:id/unfollow
 *  POST /api/chat/conversation/:userId  (Message button)
 *  GET  /api/posts?author=userId&limit=3 (Recent Posts)
 *
 * Route: /profile/:id  (protected)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate }                    from "react-router-dom";
import toast                                          from "react-hot-toast";
import { formatDistanceToNow }                        from "date-fns";
import {
  Pencil, Camera, Check, X,
  BookOpen, GraduationCap, Calendar,
  Building2, Code2, Link2,
  ExternalLink, ChevronRight,
  GitFork, Globe, AtSign,
  MessageCircle, Heart, LayoutGrid,
} from "lucide-react";

import api              from "../api/axios.js";
import { useAuth }      from "../hooks/useAuth.js";
import Avatar           from "../components/common/Avatar.jsx";
import Button           from "../components/common/Button.jsx";
import Loader           from "../components/common/Loader.jsx";
import EmptyState       from "../components/common/EmptyState.jsx";
import FollowListModal  from "../components/profile/FollowListModal.jsx";
import ProfileEditModal from "../components/profile/ProfileEditModal.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_AVATAR_BYTES  = 2 * 1024 * 1024;
const LOOKING_FOR_CHIPS = ["Study Partner","Project Collab","Hackathon Team","Friends","Networking"];
const OPTIONAL_FIELDS   = ["phone","gender","dateOfBirth","yearOfJoining","rollNumber","hostelOrDay","clubs","bio","github","linkedin","instagram"];
const OPTIONAL_ARRAYS   = ["skills","hobbies","lookingFor"];

// ── Profile completion % ──────────────────────────────────────────────────────
function calcCompletion(profile) {
  if (!profile) return 0;
  let filled = 0;
  const total = OPTIONAL_FIELDS.length + OPTIONAL_ARRAYS.length;
  OPTIONAL_FIELDS.forEach((f) => { if (profile[f]) filled++; });
  OPTIONAL_ARRAYS.forEach((f) => { if ((profile[f] ?? []).length > 0) filled++; });
  return Math.round((filled / total) * 100);
}

// ── Completion hint text ───────────────────────────────────────────────────────
function completionHint(profile) {
  const missing = [];
  if (!profile.skills?.length)    missing.push("skills");
  if (!profile.hobbies?.length)   missing.push("hobbies");
  if (!profile.github)             missing.push("GitHub");
  if (!profile.linkedin)           missing.push("LinkedIn");
  if (!profile.bio)                missing.push("a bio");
  if (missing.length === 0)        return null;
  return `Add ${missing.slice(0, 2).join(" and ")} to reach 100%`;
}

// ── Relative time ──────────────────────────────────────────────────────────────
const relTime = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return ""; }
};

// ── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, onEdit, isOwn, children }) => (
  <div
    className="rounded-2xl p-4 md:p-5"
    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
  >
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {/* Accent icon container */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "var(--accent-light)" }}
        >
          <Icon size={14} style={{ color: "var(--accent)" }} />
        </span>
        <h2 className="text-sm font-bold font-display" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
      {isOwn && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-bold transition-colors duration-150 min-h-0"
          style={{ color: "var(--accent)" }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
        >
          Edit
        </button>
      )}
    </div>
    {children}
  </div>
);

// ── Field Box ─────────────────────────────────────────────────────────────────
const FieldBox = ({ label, value }) => {
  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
  return (
    <div
      className="rounded-xl p-3"
      style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {isEmpty
        ? <p className="text-xs italic mt-1" style={{ color: "var(--text-muted)" }}>Not set</p>
        : <p className="text-xs font-medium mt-1 break-words" style={{ color: "var(--text-primary)" }}>{value}</p>
      }
    </div>
  );
};

// ── Tag Chips (view-only) ─────────────────────────────────────────────────────
const TagChips = ({ items }) => (
  <div className="flex flex-wrap gap-2">
    {items.length === 0
      ? <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>No items added yet</p>
      : items.map((t, i) => (
          <span
            key={i}
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border:          "1px solid var(--border)",
              color:           "var(--text-primary)",
            }}
          >
            {t}
          </span>
        ))
    }
  </div>
);

// ── Looking For chips (view-only) ─────────────────────────────────────────────
const LookingForChips = ({ items }) => (
  <div className="flex flex-wrap gap-2">
    {items.length === 0
      ? <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>None selected</p>
      : items.map((chip) => (
          <span
            key={chip}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor: "var(--accent-light)",
              border:          "1px solid var(--accent-border)",
              color:           "#9a3412",
            }}
          >
            {chip}
          </span>
        ))
    }
  </div>
);

// ── Social Link Row ───────────────────────────────────────────────────────────
const SocialRow = ({ platform, icon: Icon, iconBg, iconColor, value, onEditClick, isOwn }) => {
  const hasValue = Boolean(value);

  const handleClick = () => {
    if (hasValue) {
      window.open(value, "_blank", "noopener,noreferrer");
    } else if (isOwn && onEditClick) {
      onEditClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 cursor-pointer"
      style={{
        backgroundColor: "var(--bg-elevated)",
        border:          "1px solid var(--border)",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* Platform icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>

      {/* Platform + link */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold font-display" style={{ color: "var(--text-primary)" }}>{platform}</p>
        {hasValue
          ? <p className="text-xs mt-0.5 truncate" style={{ color: "var(--accent)" }}>{value}</p>
          : <p className="text-xs italic mt-0.5" style={{ color: "var(--text-muted)" }}>Not set</p>
        }
      </div>

      {/* Right icon */}
      {hasValue
        ? <ExternalLink size={14} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
        : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { user, updateUser } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({});
  const [saving,    setSaving]    = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const fileInputRef = useRef(null);

  const [isFollowing,   setIsFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [msgLoading, setMsgLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("followers");

  // Recent posts
  const [recentPosts,        setRecentPosts]        = useState([]);
  const [recentPostsLoading, setRecentPostsLoading] = useState(false);

  const isOwnProfile = profile &&
    (profile.id === user?._id || profile.id === user?.id ||
     profile._id === user?._id || profile._id === user?.id);

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

  // ── Fetch recent posts ───────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchRecent = async () => {
      setRecentPostsLoading(true);
      try {
        const { data } = await api.get(`/posts?author=${id}&limit=3`);
        setRecentPosts(data.posts ?? []);
      } catch {
        setRecentPosts([]);
      } finally {
        setRecentPostsLoading(false);
      }
    };
    fetchRecent();
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

  // ── Message ──────────────────────────────────────────────────────────────
  const handleMessage = useCallback(async () => {
    if (msgLoading) return;
    setMsgLoading(true);
    try {
      const { data } = await api.post(`/chat/conversation/${id}`);
      navigate(`/chat/${data.conversation?._id ?? data._id ?? ""}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not open conversation.");
    } finally {
      setMsgLoading(false);
    }
  }, [id, navigate, msgLoading]);

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
    if (file.size > MAX_AVATAR_BYTES)     { toast.error("Image must be under 2 MB.");     e.target.value = ""; return; }
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
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="rounded-2xl p-5 h-56" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
          <div className="rounded-2xl p-5 h-36" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
          <div className="rounded-2xl p-5 h-36" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg-primary)" }}>
        <EmptyState
          emoji="👤"
          title="User not found"
          subtitle="This profile doesn't exist or has been removed."
        />
      </div>
    );
  }

  const displaySrc = avatarPreview ?? profile.profilePicture ?? null;
  const completion  = calcCompletion(profile);
  const hint        = completionHint(profile);
  const dob         = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  // ── Recent Posts Section (reusable) ──────────────────────────────────────
  const RecentPostsSection = () => (
    <SectionCard icon={LayoutGrid} title="Recent Posts" isOwn={isOwnProfile}>
      {recentPostsLoading ? (
        <Loader size="sm" text="" />
      ) : recentPosts.length === 0 ? (
        <p className="text-xs italic text-center py-4" style={{ color: "var(--text-muted)" }}>No posts yet</p>
      ) : (
        <div className="space-y-2">
          {recentPosts.map((post) => (
            <div
              key={post._id}
              className="rounded-xl p-3 cursor-pointer transition-colors duration-150"
              style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <p
                className="text-xs font-normal leading-[1.65] mb-2"
                style={{ color: "var(--text-primary)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
              >
                {post.content}
              </p>
              <div className="flex items-center gap-3" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                <span className="flex items-center gap-1">
                  <Heart size={11} />
                  {post.likes?.length ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} />
                  {post.comments?.length ?? 0}
                </span>
                <span className="ml-auto">{relTime(post.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div className="animate-fade-in">

        {/* ── Responsive container ─────────────────────────────────────────── */}
        <div
          className="
            max-w-2xl mx-auto px-4 py-4 pb-24
            lg:max-w-5xl lg:grid lg:grid-cols-[1fr_288px] lg:gap-6 lg:items-start lg:px-6 lg:py-6
          "
        >

          {/* ── LEFT COLUMN — main content ─────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* ══════════════════════════════════════════════════════════════
                SECTION 1: Profile Header Card
            ══════════════════════════════════════════════════════════════ */}
            <div
              className="rounded-2xl p-5 overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              {/* Top row: avatar + info */}
              <div className="flex gap-4 items-start mb-5">

                {/* ── Avatar section ───────────────────────────────────────── */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="relative">
                    {/* Avatar with accent ring */}
                    <div
                      className="rounded-full p-0.5"
                      style={{ background: "var(--accent-light)", border: "2px solid var(--accent-border)" }}
                    >
                      <Avatar src={displaySrc} name={profile.name} size="xl" />
                    </div>

                    {/* Camera edit button — own profile only */}
                    {isOwnProfile && !avatarPreview && (
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        aria-label="Change avatar"
                        className="
                          absolute bottom-0 right-0
                          w-6 h-6 rounded-full
                          flex items-center justify-center
                          cursor-pointer min-h-0
                          transition-transform duration-150
                          hover:scale-110
                        "
                        style={{ backgroundColor: "var(--accent)", border: "2px solid var(--bg-surface)" }}
                      >
                        <Camera size={10} color="#ffffff" />
                      </button>
                    )}
                  </div>

                  {/* "Tap to change" hint */}
                  {isOwnProfile && !avatarPreview && (
                    <p className="text-[8px] text-center" style={{ color: "var(--text-muted)" }}>
                      Tap to change
                    </p>
                  )}

                  {/* Avatar confirm / cancel */}
                  {avatarPreview && (
                    <div className="flex gap-1.5 mt-1">
                      <Button
                        id="avatar-confirm-btn"
                        onClick={handleAvatarConfirm}
                        disabled={uploading}
                        loading={uploading}
                        variant="primary"
                        size="xs"
                        icon={<Check size={11} strokeWidth={2.5} />}
                      >
                        {uploading ? "Uploading…" : "Save"}
                      </Button>
                      <Button
                        id="avatar-cancel-btn"
                        onClick={handleAvatarCancel}
                        disabled={uploading}
                        variant="secondary"
                        size="xs"
                        icon={<X size={11} strokeWidth={2.5} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-hidden="true"
                  />
                </div>

                {/* ── Info section ─────────────────────────────────────────── */}
                <div className="flex-1 min-w-0">

                  {/* Name */}
                  <h1
                    className="text-xl font-black font-display leading-tight break-words"
                    style={{ color: "var(--text-primary)", letterSpacing: "-0.035em" }}
                  >
                    {profile.name}
                  </h1>

                  {/* Meta pills */}
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {profile.branch && (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        <BookOpen size={12} style={{ color: "var(--accent)" }} />
                        {profile.branch}
                      </span>
                    )}
                    {profile.branch && profile.semester && (
                      <span style={{ color: "var(--border)", fontSize: "12px" }}>·</span>
                    )}
                    {profile.semester && (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        <GraduationCap size={12} style={{ color: "var(--accent)" }} />
                        Sem {profile.semester}
                      </span>
                    )}
                    {profile.yearOfJoining && (
                      <>
                        <span style={{ color: "var(--border)", fontSize: "12px" }}>·</span>
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          <Calendar size={12} style={{ color: "var(--accent)" }} />
                          {profile.yearOfJoining}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio ? (
                    <p className="text-xs font-normal leading-[1.65] mt-2 max-w-xs" style={{ color: "var(--text-secondary)" }}>
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs italic mt-2" style={{ color: "var(--text-muted)" }}>
                      {isOwnProfile ? "No bio yet — click Edit to add one" : "No bio yet"}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {isOwnProfile ? (
                      /* Edit Profile */
                      <Button
                        id="edit-profile-btn"
                        onClick={enterEditMode}
                        variant="accent-light"
                        size="sm"
                        icon={<Pencil size={13} />}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        {/* Follow / Unfollow */}
                        <Button
                          id="follow-toggle-btn"
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          loading={followLoading}
                          variant={isFollowing ? "secondary" : "primary"}
                          size="sm"
                          aria-label={isFollowing ? "Unfollow user" : "Follow user"}
                        >
                          {isFollowing ? "Unfollow" : "Follow"}
                        </Button>

                        {/* Message */}
                        <Button
                          id="message-btn"
                          onClick={handleMessage}
                          disabled={msgLoading}
                          loading={msgLoading}
                          variant="secondary"
                          size="sm"
                          icon={<MessageCircle size={13} />}
                        >
                          Message
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Stats row ─────────────────────────────────────────────────── */}
              <div
                className="flex"
                style={{
                  borderTop:    "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  margin:       "0 -20px",
                }}
              >
                {/* Posts */}
                <div
                  className="flex-1 text-center py-3 transition-colors duration-150"
                  style={{ borderRight: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <p className="text-xl font-black tabular-nums tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {profile.postCount ?? recentPosts.length ?? 0}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    Posts
                  </p>
                </div>

                {/* Followers */}
                <button
                  id="followers-stat-btn"
                  onClick={() => openModal("followers")}
                  className="flex-1 text-center py-3 transition-colors duration-150 cursor-pointer focus:outline-none"
                  style={{ borderRight: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <p className="text-xl font-black tabular-nums tracking-tight" style={{ color: "var(--accent)", letterSpacing: "-0.02em" }}>
                    {profile.followerCount ?? 0}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    Followers
                  </p>
                </button>

                {/* Following */}
                <button
                  id="following-stat-btn"
                  onClick={() => openModal("following")}
                  className="flex-1 text-center py-3 transition-colors duration-150 cursor-pointer focus:outline-none"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <p className="text-xl font-black tabular-nums tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {profile.followingCount ?? 0}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    Following
                  </p>
                </button>
              </div>

              {/* ── Profile completion bar — own profile only ─────────────────── */}
              {isOwnProfile && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
                      Profile completion
                    </span>
                    <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>
                      {completion}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-elevated)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${completion}%`, backgroundColor: "var(--accent)" }}
                    />
                  </div>
                  {completion < 100 && hint && (
                    <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>{hint}</p>
                  )}
                  {completion === 100 && (
                    <p className="text-[10px] mt-2 font-semibold" style={{ color: "var(--accent)" }}>
                      🎉 Profile complete!
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* END Header Card */}

            {/* ══════════════════════════════════════════════════════════════
                SECTION 2: Academic Information
            ══════════════════════════════════════════════════════════════ */}
            <SectionCard icon={BookOpen} title="Academic Information" isOwn={isOwnProfile} onEdit={enterEditMode}>
              <div className="grid grid-cols-2 gap-2">
                <FieldBox label="Branch / Department" value={profile.branch} />
                <FieldBox label="Semester"            value={profile.semester ? `Semester ${profile.semester}` : ""} />
                <FieldBox label="Year of Joining"     value={profile.yearOfJoining ? String(profile.yearOfJoining) : ""} />
                <FieldBox label="Roll Number"         value={profile.rollNumber} />
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 3: Campus Life
            ══════════════════════════════════════════════════════════════ */}
            <SectionCard icon={Building2} title="Campus Life" isOwn={isOwnProfile} onEdit={enterEditMode}>
              <div className="grid grid-cols-2 gap-2">
                <FieldBox label="Stay"              value={profile.hostelOrDay} />
                <FieldBox label="Clubs / Societies" value={profile.clubs} />
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 4: Skills & Interests
            ══════════════════════════════════════════════════════════════ */}
            <SectionCard icon={Code2} title="Skills & Interests" isOwn={isOwnProfile} onEdit={enterEditMode}>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Skills</p>
                  <TagChips items={profile.skills ?? []} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Hobbies</p>
                  <TagChips items={profile.hobbies ?? []} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Looking For</p>
                  <LookingForChips items={profile.lookingFor ?? []} />
                </div>
              </div>
            </SectionCard>

            {/* ══════════════════════════════════════════════════════════════
                SECTION 5: Social Links
            ══════════════════════════════════════════════════════════════ */}
            <SectionCard icon={Link2} title="Social Links" isOwn={isOwnProfile} onEdit={enterEditMode}>
              <div className="flex flex-col gap-2">
                <SocialRow
                  platform="GitHub"
                  icon={GitFork}
                  iconBg="#f0f0f0"
                  iconColor="#2d2416"
                  value={profile.github}
                  isOwn={isOwnProfile}
                  onEditClick={enterEditMode}
                />
                <SocialRow
                  platform="LinkedIn"
                  icon={Globe}
                  iconBg="#e8f0fe"
                  iconColor="#0077b5"
                  value={profile.linkedin}
                  isOwn={isOwnProfile}
                  onEditClick={enterEditMode}
                />
                <SocialRow
                  platform="Instagram"
                  icon={AtSign}
                  iconBg="var(--accent-light)"
                  iconColor="var(--accent)"
                  value={profile.instagram}
                  isOwn={isOwnProfile}
                  onEditClick={enterEditMode}
                />
              </div>
            </SectionCard>

            {/* Recent Posts — mobile only (below main sections) */}
            <div className="lg:hidden">
              <RecentPostsSection />
            </div>

          </div>
          {/* END left column */}

          {/* ── RIGHT COLUMN — sidebar (lg+ only) ───────────────────────────── */}
          <aside className="hidden lg:block sticky top-20 self-start space-y-4">
            <RecentPostsSection />
          </aside>

        </div>
      </div>

      {/* ── Follow List Modal ─────────────────────────────────────────────────── */}
      <FollowListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === "followers" ? "Followers" : "Following"}
        userId={id}
        type={modalType}
      />

      {/* ── Edit Profile Modal ────────────────────────────────────────────────── */}
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
