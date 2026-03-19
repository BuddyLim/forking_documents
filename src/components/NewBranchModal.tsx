import { useState } from "react";
import { useResumeStore } from "../store/useResumeStore";
// import { SectionHeader, TextField } from "./FormatPanel";

interface Props {
  onClose: () => void;
}

export default function NewBranchModal({ onClose }: Props) {
  const { branches, currentBranchId, createBranch } = useResumeStore();
  const [documentData, setDocumentData] = useState({
    name: "",
    pdfTitle: "",
    pdfAuthor: "",
  });
  const [parentId, setParentId] = useState(currentBranchId ?? "");

  const branchList = Object.values(branches).sort(
    (a, b) => a.createdAt - b.createdAt,
  );

  const handleCreate = () => {
    const trimmed = documentData.name.trim();
    // const trimmedTitle = documentData.pdfTitle.trim();
    // const trimmedAuthor = documentData.pdfAuthor.trim();
    if (!trimmed || !parentId) return;
    createBranch(trimmed, parentId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-6 w-[380px] shadow-2xl">
        <h2 className="text-sm font-semibold text-white mb-4">New version</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Copy from
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {branchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Version name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. swe-google"
              value={documentData.name}
              onChange={(e) =>
                setDocumentData((prev) => ({ ...prev, name: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="w-full bg-[#0d0d0d] border border-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
        {/* <section>
          <SectionHeader title="PDF Metadata" />
          <div className="space-y-4">
            <TextField
              label="Document title"
              value={documentData.pdfTitle}
              placeholder={""}
              hint="Shown in Chrome PDF viewer tab, decoupled from branch name and file name."
              onChange={(e) =>
                setDocumentData((prev) => ({ ...prev, pdfTitle: e }))
              }
            />
            <TextField
              label="Author"
              value={documentData.pdfAuthor}
              placeholder="Your name"
              onChange={(e) =>
                setDocumentData((prev) => ({ ...prev, pdfAuthor: e }))
              }
            />
          </div>
        </section> */}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-[#2d2d2d] hover:border-[#4d4d4d] text-gray-400 hover:text-white text-sm py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!documentData.name.trim() || !parentId}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Create version
          </button>
        </div>
      </div>
    </div>
  );
}
