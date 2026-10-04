import { ADS_ENABLED, AD_SLOT_HEIGHT, type AdPlacement } from "@/app/blog/lib/ads";

/**
 * A reserved, labelled space for a future paid ad. Renders nothing while ads
 * are off, unless `preview` is set (from `?ads=preview`), which outlines the slot.
 */
export function AdSlot({ placement, preview = false }: { placement: AdPlacement; preview?: boolean }) {
  if (!ADS_ENABLED && !preview) return null;
  const minHeight = AD_SLOT_HEIGHT[placement];

  return (
    <aside className={`mm-ad${ADS_ENABLED ? "" : " mm-ad--preview"}`} aria-label="Advertisement">
      <span className="mm-ad__label">Advertisement</span>
      <div className="mm-ad__frame" data-ad-placement={placement} style={{ minHeight }}>
        {!ADS_ENABLED && <span className="mm-ad__hint">Ad slot · {placement}</span>}
      </div>
    </aside>
  );
}
