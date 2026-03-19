import { useEffect, useMemo, useState } from "react";
import { diffLines, Change } from "diff";
import { useResumeStore } from "../store/useResumeStore";

interface Props {
  baseBranchId: string;
  onClose: () => void;
}

export default function DiffModal({ baseBranchId, onClose }: Props) {
  const branches = useResumeStore((s) => s.branches);
  const branchList = useMemo(
    () => Object.values(branches).sort((a, b) => a.name.localeCompare(b.name)),
    [branches],
  );

  const [compareId, setCompareId] = useState<string>(() => {
    // Default to first branch that isn't the base
    return branchList.find((b) => b.id !== baseBranchId)?.id ?? baseBranchId;
  });

  const baseBranch = branches[baseBranchId];
  const compareBranch = branches[compareId];

  const diff = useMemo<Change[]>(() => {
    if (!baseBranch || !compareBranch) return [];
    return diffLines(baseBranch.content, compareBranch.content);
  }, [baseBranch, compareBranch]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const c of diff) {
      const lines = c.count ?? 0;
      if (c.added) added += lines;
      else if (c.removed) removed += lines;
    }
    return { added, removed };
  }, [diff]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#141414] border-l border-[#2d2d2d]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2d2d2d] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Diff
            </span>
            {/* Base */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/80" />
              <span className="text-xs font-mono text-gray-300">
                {baseBranch?.name ?? "—"}
              </span>
            </div>
            <span className="text-gray-600 text-xs">vs</span>
            {/* Compare selector */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400/80" />
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                className="bg-[#1c1c1c] border border-[#333] text-xs font-mono text-gray-200 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
              >
                {branchList.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.id === baseBranchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            {compareId !== baseBranchId && (
              <div className="flex items-center gap-2 text-[11px] font-mono">
                {stats.added > 0 && (
                  <span className="text-green-400">+{stats.added}</span>
                )}
                {stats.removed > 0 && (
                  <span className="text-red-400">-{stats.removed}</span>
                )}
                {stats.added === 0 && stats.removed === 0 && (
                  <span className="text-gray-500">identical</span>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-200 transition-colors p-1 rounded hover:bg-white/8"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.7 3.3a1 1 0 0 0-1.4 0L8 6.6 4.7 3.3a1 1 0 0 0-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 0 0 1.4 1.4L8 9.4l3.3 3.3a1 1 0 0 0 1.4-1.4L9.4 8l3.3-3.3a1 1 0 0 0 0-1.4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed">
          {compareId === baseBranchId ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Select a different branch to compare
            </div>
          ) : diff.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              No differences
            </div>
          ) : (
            <div>
              {diff.map((change, i) => {
                const lines = change.value
                  .replace(/\n$/, "")
                  .split("\n");
                if (change.added) {
                  return lines.map((line, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="flex bg-green-500/10 border-l-2 border-green-500/60 hover:bg-green-500/15"
                    >
                      <span className="w-6 text-center text-green-500/50 flex-shrink-0 select-none py-0.5">
                        +
                      </span>
                      <span className="text-green-300 px-3 py-0.5 whitespace-pre-wrap break-all">
                        {line}
                      </span>
                    </div>
                  ));
                }
                if (change.removed) {
                  return lines.map((line, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="flex bg-red-500/10 border-l-2 border-red-500/60 hover:bg-red-500/15"
                    >
                      <span className="w-6 text-center text-red-500/50 flex-shrink-0 select-none py-0.5">
                        -
                      </span>
                      <span className="text-red-300 px-3 py-0.5 whitespace-pre-wrap break-all">
                        {line}
                      </span>
                    </div>
                  ));
                }
                // Unchanged — collapse long runs
                if (lines.length > 6) {
                  return [
                    ...lines.slice(0, 3).map((line, j) => (
                      <div key={`${i}-top-${j}`} className="flex hover:bg-white/3">
                        <span className="w-6 flex-shrink-0" />
                        <span className="text-gray-600 px-3 py-0.5 whitespace-pre-wrap break-all">
                          {line}
                        </span>
                      </div>
                    )),
                    <div
                      key={`${i}-collapse`}
                      className="flex items-center gap-2 px-4 py-1 text-gray-600 bg-[#1a1a1a] border-y border-[#252525]"
                    >
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="opacity-40">
                        <path d="M8 3a1 1 0 0 1 .7.3l4 4a1 1 0 0 1-1.4 1.4L8 5.4 4.7 8.7a1 1 0 0 1-1.4-1.4l4-4A1 1 0 0 1 8 3zm0 5a1 1 0 0 1 .7.3l4 4a1 1 0 0 1-1.4 1.4L8 10.4l-3.3 3.3a1 1 0 0 1-1.4-1.4l4-4A1 1 0 0 1 8 8z"/>
                      </svg>
                      <span className="text-[10px]">{lines.length - 6} unchanged lines</span>
                    </div>,
                    ...lines.slice(-3).map((line, j) => (
                      <div key={`${i}-bot-${j}`} className="flex hover:bg-white/3">
                        <span className="w-6 flex-shrink-0" />
                        <span className="text-gray-600 px-3 py-0.5 whitespace-pre-wrap break-all">
                          {line}
                        </span>
                      </div>
                    )),
                  ];
                }
                return lines.map((line, j) => (
                  <div key={`${i}-${j}`} className="flex hover:bg-white/3">
                    <span className="w-6 flex-shrink-0" />
                    <span className="text-gray-600 px-3 py-0.5 whitespace-pre-wrap break-all">
                      {line}
                    </span>
                  </div>
                ));
              })}
            </div>
          )}
        </div>
    </div>
  );
}
