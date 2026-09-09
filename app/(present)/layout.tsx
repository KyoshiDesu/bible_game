import { type ReactNode } from "react";

/**
 * The projector.
 *
 * No rail, no topbar, no navigation of any kind: this screen is pointed at a
 * room, and everything on it is either the case study or the one control the
 * leader needs next. The dark surfaces come from the violet tokens rather than
 * from a theme — the curriculum has one palette, and this is the end of it.
 */
export default function PresentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-violet-deep text-on-violet">{children}</div>
  );
}
