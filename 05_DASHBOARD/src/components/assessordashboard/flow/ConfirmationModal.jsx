import { AlertTriangle } from "lucide-react";

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-950">
              {title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#002f86] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00266b]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
