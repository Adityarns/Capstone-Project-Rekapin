/**
 * ============================================================
 *    REKAPIN — Edit Profile Modal
 *    src/components/profile/EditProfileModal.jsx
 *
 *    Fix StrictMode warning: "setState synchronously within effect"
 *
 *    Root cause sebelumnya:
 *      useEffect(() => { setDraft(...); setPreview(...) }, [isOpen])
 *      → React StrictMode menjalankan effect 2x → cascading renders
 *
 *    Solusi (React-canonical "key to reset" pattern):
 *      1. Hapus useEffect sepenuhnya
 *      2. Inisialisasi state via lazy initializer → hanya jalan saat mount
 *      3. Parent meneruskan key={String(isOpen)} → React remount
 *         komponen setiap kali modal dibuka, sehingga lazy initializer
 *         selalu berjalan dengan nilai user terbaru tanpa effect
 *
 *    Props:
 *    - isOpen:  boolean
 *    - onClose: () => void
 *    - user:    { name, email, phone, initials, avatarSrc }
 *    - onSave:  (updatedUser) => void
 * ============================================================
 *
 * @format
 */

import { useState, useRef } from "react";
import Modal from "./Modal";

const IconCamera = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function EditProfileModal({ isOpen, onClose, user, onSave }) {
  /*
   * Lazy initializer: fungsi ini hanya dipanggil SEKALI saat
   * komponen pertama kali di-mount. Karena parent menggunakan
   * key={String(isOpen)}, React akan unmount + remount komponen
   * ini setiap kali modal dibuka → draft selalu fresh dari `user`
   * tanpa perlu useEffect.
   */
  const [draft, setDraft] = useState(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  }));

  const [avatarPreview, setPreview] = useState(() => user?.avatarSrc ?? null);
  const [avatarFile, setAvatarFile] = useState(null);

  const fileInputRef = useRef(null);

  /* File picker → local DataURL preview via FileReader */
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      ...draft,
      avatarSrc: avatarPreview,
      avatarFile,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      {/* ── Avatar upload area ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-3)",
          paddingBottom: "var(--space-2)",
        }}
      >
        {/* Preview circle */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "9999px",
            backgroundColor: "var(--color-neutral-200)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: "var(--weight-bold)",
                color: "var(--color-neutral-500)",
                userSelect: "none",
              }}
            >
              {user?.initials ?? "?"}
            </span>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
          aria-label="Upload profile photo"
        />

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--color-border-strong)",
            background: "transparent",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-medium)",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <IconCamera />
          Change Photo
        </button>

        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            margin: 0,
          }}
        >
          JPG, PNG, or WebP — max 5MB
        </p>
      </div>

      {/* ── Form fields ── */}
      <div className="modal-field">
        <label className="modal-label" htmlFor="edit-name">
          Full Name
        </label>
        <input
          id="edit-name"
          type="text"
          className="modal-input"
          placeholder="Your full name"
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          autoComplete="name"
        />
      </div>

      <div className="modal-field">
        <label className="modal-label" htmlFor="edit-email">
          Email Address
        </label>
        <input
          id="edit-email"
          type="email"
          className="modal-input"
          placeholder="your@email.com"
          value={draft.email}
          onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
          autoComplete="email"
        />
      </div>

      <div className="modal-field">
        <label className="modal-label" htmlFor="edit-phone">
          Phone Number
        </label>
        <input
          id="edit-phone"
          type="tel"
          className="modal-input"
          placeholder="+62 ..."
          value={draft.phone}
          onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
          autoComplete="tel"
        />
      </div>

      {/* ── Actions ── */}
      <div className="modal-actions">
        <button type="button" className="modal-btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="modal-btn-primary"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
