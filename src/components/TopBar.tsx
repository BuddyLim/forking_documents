import { useState } from "react";
import { useResumeStore } from "../store/useResumeStore";
import NewBranchModal from "./NewBranchModal";

interface Props {
  onExport: () => void;
  onToggleFormat: () => void;
  onToggleBranch: () => void;
  formatOpen: boolean;
  branchOpen: boolean;
}

export default function TopBar({
  onExport,
  onToggleFormat,
  onToggleBranch,
  formatOpen,
  branchOpen,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const { branches, currentBranchId } = useResumeStore();
  const currentBranch = currentBranchId ? branches[currentBranchId] : null;

  return (
    <>
      <header className="flex items-center justify-between px-4 h-11 bg-[#111] border-b border-[#2d2d2d] flex-shrink-0">
        {/* Left: app name + current branch */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white tracking-tight">
            Forked_Final_Final_V2
          </span>
          {currentBranch && (
            <>
              <span className="text-[#3d3d3d]">/</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleBranch}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
                    branchOpen
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border-[#2d2d2d]"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 text-indigo-400"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM4.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" />
                  </svg>
                  <span className="text-xs font-mono text-gray-300">
                    {currentBranch.name}
                  </span>
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2d2d2d] rounded-md transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
            </svg>
            New version
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Format toggle */}
          <button
            onClick={onToggleFormat}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
              formatOpen
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                : "text-gray-300 hover:text-white bg-[#1e1e1e] hover:bg-[#2a2a2a] border-[#2d2d2d]"
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M7.429 1.525a6.593 6.593 0 0 1 1.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.18.501.28.45.28.997.35 1.553.07l1.018-.5a.158.158 0 0 1 .152.013 6.829 6.829 0 0 1 .571.498c.165.15.317.308.455.472a.158.158 0 0 1 .013.151l-.499 1.02c-.28.553-.209 1.1.07 1.551.101.161.195.328.28.501.223.448.629.85 1.189.997l1.105.288a.158.158 0 0 1 .146.137 6.628 6.628 0 0 1 0 1.142.158.158 0 0 1-.137.146l-1.105.289c-.56.147-.967.55-1.188.997-.087.174-.181.341-.28.501-.28.45-.35.997-.07 1.553l.499 1.018a.158.158 0 0 1-.013.152 6.767 6.767 0 0 1-.971.926.158.158 0 0 1-.151.013l-1.02-.499c-.553-.28-1.1-.208-1.55.071-.162.1-.33.195-.502.28-.448.222-.85.629-.997 1.188l-.288 1.105a.158.158 0 0 1-.137.146 6.6 6.6 0 0 1-1.142 0 .158.158 0 0 1-.146-.137l-.289-1.105c-.147-.56-.55-.966-.997-1.188a5.732 5.732 0 0 1-.501-.28c-.45-.279-.997-.35-1.553-.07l-1.018.499a.158.158 0 0 1-.152-.013 6.807 6.807 0 0 1-.926-.971.158.158 0 0 1-.013-.151l.5-1.02c.28-.553.208-1.1-.071-1.55a5.764 5.764 0 0 1-.28-.502c-.222-.448-.629-.85-1.188-.997L1.67 9.716a.158.158 0 0 1-.146-.137 6.625 6.625 0 0 1 0-1.142.158.158 0 0 1 .137-.146l1.105-.289c.56-.147.966-.55 1.188-.997.087-.174.181-.341.28-.501.279-.45.35-.997.07-1.553l-.499-1.018a.158.158 0 0 1 .013-.152 6.785 6.785 0 0 1 .971-.926.158.158 0 0 1 .151-.013l1.02.5c.553.28 1.1.208 1.55-.071.162-.1.33-.195.502-.28.448-.222.85-.629.997-1.188l.288-1.105a.158.158 0 0 1 .137-.146ZM8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
            </svg>
            Format
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5Z" />
              <path d="M.5 5.5A1.5 1.5 0 0 1 2 4h12a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 14 12h-1v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1H2a1.5 1.5 0 0 1-1.5-1.5v-5Zm3.5.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1H4Zm0 2a.5.5 0 0 0 0 1H6a.5.5 0 0 0 0-1H4Z" />
              <path d="M3 11v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H3Zm2.5 1h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1Zm0 1.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1Z" />
            </svg>
            Print / PDF
          </button>
        </div>
      </header>

      {showModal && <NewBranchModal onClose={() => setShowModal(false)} />}
    </>
  );
}
