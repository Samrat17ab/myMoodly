import type { ReactNode } from "react";
import { IconClose } from "@/app/components/icons";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-bg">
      <div className="modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <IconClose size={16} />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
