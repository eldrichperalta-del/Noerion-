export default function RevokeCertificateModal({
  open,
  certificate,
  onClose,
  onRevoke,
}) {
  if (!open || !certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

        <div className="px-6 py-4">
          <h2 className="text-xl font-bold text-red-400">
            Revoke Certificate
          </h2>
        </div>

        <div className="p-6">
          <div className="bg-red-20 border border-red-100 text-red-500 p-4 rounded-lg">
            Warning: This action will permanently revoke the certificate.
            Please confirm that you wish to proceed with this irreversible process.
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-3">

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={() => onRevoke?.(certificate)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Revoke
          </button>

        </div>

      </div>
    </div>
  );
}