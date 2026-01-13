import { AlertTriangle, X } from "lucide-react";

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-lg shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-highlight/30">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-surface-highlight/10 flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-surface-highlight hover:bg-surface-highlight2 text-white/90 rounded font-bold text-xs transition-colors border border-border"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
