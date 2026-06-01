import "./Notifications.css";

export default function Notifications({
  isOpen,
  onClose,
  invitations = [],
  onAccept,
  onReject,
  loadingId = null,
}) {
  if (!isOpen) return null;

  return (
    <div className="notif-overlay">
      {/* Backdrop (latar belakang gelap dengan efek blur) */}
      <div
        className="notif-backdrop"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Kontainer Modal */}
      <div
        className="notif-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-title"
      >
        {/* Header */}
        <div className="notif-header">
          <h3 id="notif-title" className="notif-title">
            Team Invitations
          </h3>
          <button
            className="notif-close-btn"
            onClick={onClose}
            aria-label="Tutup notifikasi"
          >
            <span className="modal__close">x</span>
          </button>
        </div>

        {/* Body */}
        <div className="notif-body">
          {invitations.length === 0 ? (
            <div className="notif-empty">
              <span className="material-symbols-outlined notif-empty-icon">
                <p>Tidak ada undangan baru saat ini.</p>
              </span>
            </div>
          ) : (
            <div className="notif-list">
              {invitations.map((invite) => (
                <div key={invite.invitation_code} className="notif-item">
                  <p className="notif-text">
                    <span className="notif-text-bold block mb-1">Halo!</span>{" "}
                    Anda diundang untuk bergabung dengan{" "}
                    <span className="notif-text-bold">
                      {invite.business_name}
                    </span>{" "}
                    sebagai{" "}
                    <span className="notif-text-highlight">{invite.role}</span>.
                  </p>

                  <div className="notif-actions">
                    <button
                      className="notif-btn-accept"
                      onClick={() => onAccept(invite.invitation_code)}
                      disabled={loadingId === invite.invitation_code}
                    >
                      {loadingId === invite.invitation_code
                        ? "Memproses..."
                        : "Accept"}
                    </button>
                    <button
                      className="notif-btn-reject"
                      onClick={() => onReject(invite.invitation_code)}
                      disabled={loadingId === invite.invitation_code}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
