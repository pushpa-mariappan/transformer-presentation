import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fmt } from "../lib/sentence";

/** Diverging colour scale: negative → purple, zero → dark, positive → cyan. */
export function valueColor(v: number): string {
  const a = Math.min(1, Math.abs(v));
  return v >= 0 ? `rgba(34, 211, 238, ${0.12 + a * 0.75})` : `rgba(168, 85, 247, ${0.12 + a * 0.75})`;
}

export function TokenChip({
  text,
  color,
  active,
  dim,
  onClick,
  sub,
  className = "",
}: {
  text: string;
  color: string;
  active?: boolean;
  dim?: boolean;
  onClick?: () => void;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      className={`chip flex-col !items-center gap-0.5 transition ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        borderColor: active ? color : `${color}55`,
        background: active ? `${color}33` : `${color}12`,
        color,
        opacity: dim ? 0.3 : 1,
        boxShadow: active ? `0 0 24px -6px ${color}` : undefined,
      }}
    >
      <span className="whitespace-pre font-semibold">{text}</span>
      {sub !== undefined && <span className="text-[10px] text-slate-400">{sub}</span>}
    </motion.div>
  );
}

export function VectorCells({
  values,
  cell = 22,
  showValues = false,
  delay = 0,
  vertical = false,
  label,
}: {
  values: number[];
  cell?: number;
  showValues?: boolean;
  delay?: number;
  vertical?: boolean;
  label?: ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 ${vertical ? "flex-col" : ""}`}>
      {label && <div className="font-mono text-xs text-slate-400">{label}</div>}
      <div className={`flex ${vertical ? "flex-col" : ""} gap-[3px]`}>
        {values.map((v, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1, backgroundColor: valueColor(v) }}
            transition={{ delay: delay + i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center justify-center rounded-[4px] font-mono text-[9px] text-white/90"
            style={{ width: showValues ? cell * 1.7 : cell, height: cell }}
            title={fmt(v)}
          >
            {showValues ? fmt(v) : null}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Matrix({
  data,
  rowLabels,
  colLabels,
  title,
  digits = 2,
  highlightRow,
  heat = false,
  masked,
  small = false,
}: {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  title?: ReactNode;
  digits?: number;
  highlightRow?: number;
  heat?: boolean;
  masked?: (r: number, c: number) => boolean;
  small?: boolean;
}) {
  const w = small ? "min-w-[2.6rem]" : "min-w-[3.2rem]";
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {title && <div className="font-mono text-xs text-cyan-300">{title}</div>}
      <table className="border-separate border-spacing-[3px] font-mono text-[11px] sm:text-xs">
        {colLabels && (
          <thead>
            <tr>
              {rowLabels && <th />}
              {colLabels.map((c) => (
                <th key={c} className="px-1 font-normal text-slate-400">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {data.map((row, r) => (
            <tr key={r}>
              {rowLabels && <td className="pr-1 text-right text-slate-400">{rowLabels[r]}</td>}
              {row.map((v, c) => {
                const isMasked = masked?.(r, c);
                return (
                  <motion.td
                    key={c}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (r * row.length + c) * 0.015 }}
                    className={`${w} rounded-md px-1.5 py-1 text-center ${
                      highlightRow === r ? "ring-1 ring-cyan-300/70" : ""
                    } ${isMasked ? "text-slate-600" : "text-slate-100"}`}
                    style={{
                      background: isMasked
                        ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 4px, rgba(255,255,255,0.07) 4px 8px)"
                        : heat
                          ? `rgba(56, 189, 248, ${0.08 + Math.min(1, Math.max(0, v)) * 0.8})`
                          : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {isMasked ? "−∞" : fmt(v, digits)}
                  </motion.td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex flex-wrap rounded-xl border border-white/10 bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
            value === o.value ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join("-")}`}
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/60 to-purple-500/60"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-amber-100/80">
      {children}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

/** A small dot that travels along an SVG path, used to show data flowing. */
export function FlowDot({
  path,
  color = "#22d3ee",
  duration = 3,
  delay = 0,
  r = 5,
}: {
  path: string;
  color?: string;
  duration?: number;
  delay?: number;
  r?: number;
}) {
  return (
    <circle r={r} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" path={path} />
    </circle>
  );
}
