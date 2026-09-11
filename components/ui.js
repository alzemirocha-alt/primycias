"use client";

export function Btn({ children, kind = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-ink text-white",
    gold: "bg-gold text-white",
    ghost: "bg-transparent text-ink border border-ink",
    danger: "bg-rust text-white",
    subtle: "bg-paperDeep text-gray-800",
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 text-sm font-medium rounded-sm transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed ${styles[kind]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs tracking-wide mb-1.5 text-gray-500">{label}</span>
      {children}
      {hint && <span className="block text-xs mt-1 text-gray-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-white border border-line rounded-sm text-sm text-gray-900 outline-none focus:border-ink";

export function Input(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select(props) {
  return <select {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Tag({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-paperDeep text-gray-700",
    gold: "bg-[#E7E9E5] text-[#454A45]",
    sage: "bg-[#E3EBE4] text-sage",
    rust: "bg-[#F2E1DD] text-rust",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-sm inline-block ${tones[tone]}`}>{children}</span>;
}

export function Card({ children, className = "" }) {
  return <div className={`bg-white border border-line rounded-sm p-4 ${className}`}>{children}</div>;
}
