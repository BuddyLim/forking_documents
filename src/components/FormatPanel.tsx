import React from "react";
import {
  useResumeStore,
  DEFAULT_FORMAT,
  FormatSettings,
} from "../store/useResumeStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAPER_SIZES = [
  { value: "a4", label: "A4  (210 × 297 mm)" },
  { value: "letter", label: "Letter  (8.5 × 11 in)" },
  { value: "legal", label: "Legal  (8.5 × 14 in)" },
];

const FONT_FAMILIES = [
  { value: '"Georgia", "Times New Roman", serif', label: "Georgia" },
  { value: '"Arial", "Times New Roman", serif', label: "Arial" },
  { value: '"Times New Roman", Times, serif', label: "Times New Roman" },
  { value: 'Garamond, "EB Garamond", serif', label: "Garamond" },
  { value: '"Palatino Linotype", Palatino, serif', label: "Palatino" },
  { value: 'Inter, "Helvetica Neue", Arial, sans-serif', label: "Inter" },
  {
    value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    label: "Helvetica",
  },
  { value: 'Calibri, "Trebuchet MS", sans-serif', label: "Calibri" },
  {
    value: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif',
    label: "Gill Sans",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-[#2a2a2a]" />
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 0,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300 tabular-nums">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="format-slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  onChange: (v: string) => void;
}

export function TextField({
  label,
  value,
  placeholder,
  hint,
  onChange,
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded px-2 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
      />
      {hint && (
        <p className="text-[10px] text-gray-600 leading-tight">{hint}</p>
      )}
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

  const handleTextChange = (v: string) => {
    setDraft(v);
    if (isValidHex(v)) onChange(v);
  };

  const handleTextBlur = () => {
    if (!isValidHex(draft)) setDraft(value);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleTextBlur}
          maxLength={7}
          className="w-20 bg-[#0d0d0d] border border-[#2d2d2d] rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <input
          type="color"
          value={isValidHex(value) ? value : "#111111"}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border border-[#2d2d2d] p-0.5 bg-[#0d0d0d]"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FormatPanel() {
  const currentBranchId = useResumeStore((s) => s.currentBranchId);
  const branches = useResumeStore((s) => s.branches);
  const updateFormat = useResumeStore((s) => s.updateFormat);

  if (!currentBranchId) return null;

  const format = branches[currentBranchId]?.format ?? DEFAULT_FORMAT;
  const update = (patch: Partial<FormatSettings>) =>
    updateFormat(currentBranchId, patch);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-[#2d2d2d] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          Format
        </span>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ── Page ── */}
        <section>
          <SectionHeader title="Page" />
          <div className="space-y-4">
            <SelectField
              label="Paper size"
              value={format.paperSize}
              options={PAPER_SIZES}
              onChange={(v) =>
                update({ paperSize: v as FormatSettings["paperSize"] })
              }
            />
            <SliderField
              label="Horizontal margin"
              value={format.marginH}
              min={8}
              max={50}
              step={1}
              unit="mm"
              onChange={(v) => update({ marginH: v })}
            />
            <SliderField
              label="Vertical margin"
              value={format.marginV}
              min={8}
              max={60}
              step={1}
              unit="mm"
              onChange={(v) => update({ marginV: v })}
            />
          </div>
        </section>

        {/* ── Typography ── */}
        <section>
          <SectionHeader title="Typography" />
          <div className="space-y-4">
            <SelectField
              label="Font family"
              value={format.fontFamily}
              options={FONT_FAMILIES}
              onChange={(v) => update({ fontFamily: v })}
            />
            <SliderField
              label="Font size"
              value={format.fontSize}
              min={9}
              max={18}
              step={0.5}
              unit="px"
              decimals={1}
              onChange={(v) => update({ fontSize: v })}
            />
            <SliderField
              label="Line spacing"
              value={format.lineHeight}
              min={1.0}
              max={2.5}
              step={0.05}
              unit="×"
              decimals={2}
              onChange={(v) => update({ lineHeight: v })}
            />
            <SliderField
              label="Paragraph spacing"
              value={format.paragraphSpacing}
              min={0}
              max={2.0}
              step={0.05}
              unit="em"
              decimals={2}
              onChange={(v) => update({ paragraphSpacing: v })}
            />
          </div>
        </section>

        {/* ── Colors ── */}
        <section>
          <SectionHeader title="Colors" />
          <div className="space-y-4">
            <ColorField
              label="Accent"
              value={format.accentColor ?? "#111111"}
              onChange={(v) => update({ accentColor: v })}
            />
            <p className="text-[10px] text-gray-600 leading-tight">
              Applied to name, section headings, and heading underlines.
            </p>
          </div>
        </section>

        {/* ── PDF Metadata ── */}
        <section>
          <SectionHeader title="PDF Metadata" />
          <div className="space-y-4">
            <TextField
              label="Document title"
              value={format.pdfTitle}
              placeholder={branches[currentBranchId]?.name ?? ""}
              hint="Shown in Chrome PDF viewer tab, decoupled from branch name and file name."
              onChange={(v) => update({ pdfTitle: v })}
            />
            <TextField
              label="Author"
              value={format.pdfAuthor}
              placeholder="Your name"
              onChange={(v) => update({ pdfAuthor: v })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
