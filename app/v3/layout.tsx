import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, Caveat, Spline_Sans_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
});
const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-spline-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FishHaven — v3 preview",
  description: "FishHaven v3 community design preview.",
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${hanken.variable} ${caveat.variable} ${splineMono.variable}`}
    >
      {children}
      {/* Map the design's literal font-family stacks to next/font CSS vars,
          plus the keyframes the design relies on. */}
      <style>{`
        .fh-v3-root {
          font-family: var(--font-hanken), ui-sans-serif, system-ui, sans-serif;
          color: #2B2340;
          background: #FAF4EA;
          -webkit-font-smoothing: antialiased;
        }
        .fh-v3-root *, .fh-v3-root *::before, .fh-v3-root *::after { box-sizing: border-box; }
        .fh-v3-root input, .fh-v3-root textarea, .fh-v3-root button { font-family: inherit; }
        .fh-v3-root button { cursor: pointer; border: none; background: none; color: inherit; }
        .fh-v3-root a { color: inherit; text-decoration: none; }
        .fh-v3-root ::selection { background: #FFC94A; color: #2B2340; }
        .fh-v3-root ::-webkit-scrollbar { width: 9px; height: 9px; }
        .fh-v3-root ::-webkit-scrollbar-thumb { background: rgba(43,35,64,.18); border-radius: 10px; }
        .fh-v3-root ::-webkit-scrollbar-track { background: transparent; }
        .fh-v3-root :focus-visible { outline: 2.5px solid var(--c-primary,#1F7A8C); outline-offset: 2px; border-radius: 8px; }

        /* Remap the design's hard-coded font stacks to the loaded next/font families */
        .fh-v3-root [style*="Fraunces"] { font-family: var(--font-fraunces), serif !important; }
        .fh-v3-root [style*="Caveat"] { font-family: var(--font-caveat), cursive !important; }
        .fh-v3-root [style*="Spline Sans Mono"] { font-family: var(--font-spline-mono), monospace !important; }
        .fh-v3-root [style*="Hanken Grotesk"] { font-family: var(--font-hanken), sans-serif !important; }

        @keyframes bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes swim { 0% { transform: translateX(0) } 100% { transform: translateX(calc(100% - 26px)) } }
        @keyframes surface { 0% { opacity: 0; transform: translateY(16px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes ripple { 0% { transform: scale(.6); opacity: .6 } 100% { transform: scale(2.4); opacity: 0 } }
        @keyframes drawloop { to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) {
          .fh-v3-root * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}
