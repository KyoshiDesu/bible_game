import { Fraunces, IBM_Plex_Mono, Karla } from "next/font/google";

/*
 * The curriculum's three faces, self-hosted by next/font rather than fetched
 * from Google at runtime. The original file paid for two preconnects and a
 * render-blocking stylesheet; this costs neither.
 */

/** Display face. SOFT and WONK are the axes the original headings animate. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

/** Body face. */
export const karla = Karla({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-karla",
});

/** Numerals, timers, clock times, and reference labels. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

/** Applied to <html> so every element, body included, can resolve the vars. */
export const fontVariables = [
  fraunces.variable,
  karla.variable,
  plexMono.variable,
].join(" ");
