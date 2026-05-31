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
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">
    <div className="flex items-center gap-2.5 mb-4">
      <span className="bg-zinc-800 rounded-lg p-1.5 flex items-center justify-center">
        <Icon size={15} className="text-zinc-300" />
      </span>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const FieldBox = ({ label, value, href }) => {
  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
  return (
    <div className="bg-zinc-800 rounded-xl p-3">
      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      {isEmpty ? (
        <p className="text-sm text-zinc-600">Not set</p>
      ) : href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="text-sm text-zinc-200 hover:text-white flex items-center gap-1 transition-colors break-all">
          {value}
          <ExternalLink size={11} className="flex-shrink-0" />
        </a>
      ) : (
        <p className="text-sm text-zinc-200 break-words">{value}</p>
      )}
    </div>
  );
};

const TagChips = ({ items }) => (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {items.length === 0
      ? <p className="text-sm text-zinc-600">Not set</p>
      : items.map((t, i) => (
          <span key={i}
            className="px-2.5 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-full border border-zinc-700">
            {t}
          </span>
        ))
    }
  </div>
);

const LookingForDisplay = ({ items }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {LOOKING_FOR_CHIPS.map((chip) => (
      <span key={chip}
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          items.includes(chip)
            ? "bg-white text-black border-white"
            : "bg-transparent text-zinc-600 border-zinc-700"
        }`}>
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
      <div className="min-h-screen bg-zinc-950 py-6 px-4">
        <div className="w-full max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-48" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-40" />
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-40" />
        </div>
      </div>
    );
  }

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

  const displaySrc   = avatarPreview ?? profile.profilePicture ?? null;
  const completion   = calcCompletion(profile);
  const dob          = profile.dateOfBirth
    ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
    : "";

  return (
    <div className="min-h-screen bg-zinc-950 py-6 px-4 pb-10">
      <div className="w-full max-w-3xl mx-auto">

        {/* ── SECTION 1: Profile Header ─────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-4">

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
                <p className="text-[10px] text-zinc-500 text-center">Tap to change</p>
              )}
              {avatarPreview && (
                <div className="flex gap-2 mt-1">
                  <button id="avatar-confirm-btn" onClick={handleAvatarConfirm} disabled={uploading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-lg min-h-[36px] disabled:opacity-50 transition-colors">
                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                    {uploading ? "Uploading…" : "Confirm"}
                  </button>
                  <button id="avatar-cancel-btn" onClick={handleAvatarCancel} disabled={uploading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500 text-xs font-medium rounded-lg min-h-[36px] disabled:opacity-50 transition-colors">
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
                  <h1 className="text-xl font-bold text-white leading-tight break-words">{profile.name}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                    {profile.branch && (
                      <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <BookOpen size={13} className="flex-shrink-0" /> {profile.branch}
                      </span>
                    )}
                    {profile.semester && (
                      <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <GraduationCap size={13} className="flex-shrink-0" /> Semester {profile.semester}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit / Follow buttons */}
                {isOwnProfile ? (
                  <button id="edit-profile-btn" onClick={enterEditMode}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-colors min-h-[44px] flex-shrink-0">
                    <Pencil size={14} strokeWidth={2} /> Edit Profile
                  </button>
                ) : (
                  <button id="follow-toggle-btn" onClick={handleFollowToggle} disabled={followLoading}
                    aria-label={isFollowing ? "Unfollow user" : "Follow user"}
                    className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-sm font-semibold min-h-[44px] flex-shrink-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      isFollowing
                        ? "border border-zinc-600 text-white hover:bg-zinc-800"
                        : "bg-white text-black hover:bg-zinc-100"
                    }`}>
                    {followLoading ? <Loader2 size={14} className="animate-spin" /> : (isFollowing ? "Unfollow" : "Follow")}
                  </button>
                )}
              </div>

              {/* Followers / Following stats */}
              <div className="flex items-center gap-5 mt-3">
                <button id="followers-stat-btn" onClick={() => openModal("followers")}
                  className="flex flex-col items-start group">
                  <span className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors">{profile.followerCount ?? 0}</span>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Followers</span>
                </button>
                <div className="w-px h-7 bg-zinc-800" />
                <button id="following-stat-btn" onClick={() => openModal("following")}
                  className="flex flex-col items-start group">
                  <span className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors">{profile.followingCount ?? 0}</span>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Following</span>
                </button>
              </div>

              {/* Bio */}
              {profile.bio ? (
                <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              ) : isOwnProfile ? (
                <p className="mt-3 text-sm text-zinc-600 italic">Add a bio to tell people about yourself.</p>
              ) : null}

              {/* Profile completion — own profile only */}
              {isOwnProfile && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-zinc-500">Profile completion</p>
                    <p className="text-xs font-semibold text-zinc-300">{completion}%</p>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  {completion < 100 && (
                    <p className="text-[10px] text-zinc-600 mt-1">
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
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Skills</p>
              <TagChips items={profile.skills ?? []} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Hobbies</p>
              <TagChips items={profile.hobbies ?? []} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-2">Looking For</p>
              <LookingForDisplay items={profile.lookingFor ?? []} />
            </div>
          </div>
        </SectionCard>

        {/* ── SECTION 6: Social Links ───────────────────────────────────────── */}
        <SectionCard icon={Link2} title="Social Links">
          <div className="space-y-3">
            <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <Link2 size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-0.5">GitHub</p>
                {profile.github
                  ? <a href={profile.github} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-zinc-200 hover:text-white transition-colors break-all flex items-center gap-1">
                      {profile.github} <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                  : <p className="text-sm text-zinc-600">Not set</p>
                }
              </div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <Link2 size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-0.5">LinkedIn</p>
                {profile.linkedin
                  ? <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-zinc-200 hover:text-white transition-colors break-all flex items-center gap-1">
                      {profile.linkedin} <ExternalLink size={11} className="flex-shrink-0" />
                    </a>
                  : <p className="text-sm text-zinc-600">Not set</p>
                }
              </div>
            </div>
            <div className="bg-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <Globe size={16} className="text-zinc-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-0.5">Instagram</p>
                {profile.instagram
                  ? <p className="text-sm text-zinc-200">@{profile.instagram.replace(/^@/, "")}</p>
                  : <p className="text-sm text-zinc-600">Not set</p>
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
