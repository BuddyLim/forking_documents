import { useState } from "react";
import { useResumeStore, STARTER_TEMPLATE } from "../store/useResumeStore";

export default function InitModal() {
  const [name, setName] = useState("");
  const initRoot = useResumeStore((s) => s.initRoot);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    initRoot(trimmed, STARTER_TEMPLATE);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleStart();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-8 w-[420px] shadow-2xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-1">
            Forked_Final_Final_V2
          </h1>
          <p className="text-sm text-gray-400">
            Give your root resume/document a name to get started. You can derive
            it into copies later.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Base version name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. main"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Create root resume
          </button>
        </div>
      </div>
    </div>
  );
}
