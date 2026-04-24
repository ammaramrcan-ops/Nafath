import { useState, useEffect } from "react";

export function PromptDialog({
  open,
  title,
  placeholder,
  initialValue = "",
  confirmLabel = "إضافة",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[var(--shadow-deep)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-[18px] font-medium text-zen-on-surface">{title}</h3>
        <input
          autoFocus
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              onConfirm(value.trim());
            }
          }}
          className="w-full rounded-xl border border-zen-surface-container bg-zen-surface px-4 py-3 text-[15px] text-zen-on-surface outline-none transition focus:border-zen-primary"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-zen-on-surface-variant transition hover:bg-zen-surface-low"
          >
            إلغاء
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            disabled={!value.trim()}
            className="rounded-full bg-zen-primary px-5 py-2 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
