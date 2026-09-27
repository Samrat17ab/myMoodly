import { useId } from "react";

/** SVG-safe unique id prefix (React's useId() output contains characters url(#...) dislikes). */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
