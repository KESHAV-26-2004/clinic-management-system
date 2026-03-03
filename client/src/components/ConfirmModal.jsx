export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-card">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="confirm-actions">
          <button
            className="confirm-btn cancel"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="confirm-btn confirm"
            onClick={onConfirm}
          >
            Yes, Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
