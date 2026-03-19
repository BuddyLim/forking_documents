import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useResumeStore, Branch } from "../store/useResumeStore";

// Branch colors cycling palette (like git-graph)
const BRANCH_COLORS = [
  "#4f46e5", // indigo  - root
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

interface TreeNode {
  branch: Branch;
  children: TreeNode[];
  depth: number;
  colorIndex: number;
}

function buildTree(branches: Record<string, Branch>): TreeNode | null {
  const root = Object.values(branches).find((b) => b.parentId === null);
  if (!root) return null;

  let colorCounter = 0;

  function buildNode(
    branch: Branch,
    depth: number,
    colorIndex: number,
  ): TreeNode {
    const children = Object.values(branches)
      .filter((b) => b.parentId === branch.id)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((child) => {
        colorCounter++;
        return buildNode(child, depth + 1, colorCounter % BRANCH_COLORS.length);
      });
    return { branch, children, depth, colorIndex };
  }

  return buildNode(root, 0, colorCounter % BRANCH_COLORS.length);
}

// ── Panel state ───────────────────────────────────────────────────────────────

type PanelState =
  | { mode: "tree" }
  | { mode: "rename"; branchId: string }
  | { mode: "create"; parentId: string };

// ── Context menu ──────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  branchId: string;
}

interface ContextMenuProps {
  state: ContextMenuState;
  branch: Branch;
  isOnlyBranch: boolean;
  onRename: () => void;
  onCreate: () => void;
  onDelete: () => void;
  onCompare: () => void;
  onClose: () => void;
}

function ContextMenu({
  state,
  branch,
  isOnlyBranch,
  onRename,
  onCreate,
  onDelete,
  onCompare,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or Escape
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so menu stays within viewport
  const [pos, setPos] = useState({ x: state.x, y: state.y });
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPos({
      x: state.x + rect.width > vw ? state.x - rect.width : state.x,
      y: state.y + rect.height > vh ? state.y - rect.height : state.y,
    });
  }, [state.x, state.y]);

  const item =
    "w-full text-left px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-2";

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos.y - 20,
        left: pos.x,
        zIndex: 100,
      }}
      className="bg-[#1c1c1c] border border-[#333] rounded-lg shadow-2xl py-1 min-w-[190px]"
    >
      {/* Branch name header */}
      <div className="px-3 py-1.5 border-b border-[#2d2d2d] mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">
          Versions
        </span>
        <p className="font-mono text-xs text-white font-medium truncate mt-0.5">
          {branch.name}
        </p>
      </div>

      <button
        className={`${item} text-gray-300 hover:bg-white/8 hover:text-white`}
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="flex-shrink-0 opacity-60"
        >
          <path d="M13.23 1a2.4 2.4 0 0 0-1.7.7L3 10.24V13h2.76l8.54-8.54a2.4 2.4 0 0 0 0-3.39A2.4 2.4 0 0 0 13.23 1zM4.5 12H4v-.5l7.8-7.8.5.5L4.5 12z" />
        </svg>
        Rename
      </button>

      <button
        className={`${item} text-gray-300 hover:bg-white/8 hover:text-white`}
        onClick={() => {
          onCreate();
          onClose();
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="flex-shrink-0 opacity-60"
        >
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm1 10H7V9H5V7h2V5h2v2h2v2H9v2z" />
        </svg>
        <span>
          New version from{" "}
          <code className="text-indigo-400 bg-indigo-500/10 px-0.5 rounded">
            {branch.name}
          </code>
        </span>
      </button>

      <button
        className={`${item} text-gray-300 hover:bg-white/8 hover:text-white`}
        onClick={() => {
          onCompare();
          onClose();
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="flex-shrink-0 opacity-60"
        >
          <path d="M5 1a1 1 0 0 0-1 1v2H2a1 1 0 0 0 0 2h2v2H2a1 1 0 0 0 0 2h2v2H2a1 1 0 0 0 0 2h2v1a1 1 0 0 0 2 0v-1h2a1 1 0 0 0 0-2H6v-2h2a1 1 0 0 0 0-2H6V6h2a1 1 0 0 0 0-2H6V2a1 1 0 0 0-1-1zm5 0a1 1 0 0 1 1 1v1h1a1 1 0 0 1 0 2h-1v2h1a1 1 0 0 1 0 2h-1v2h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0V2a1 1 0 0 1 1-1z" />
        </svg>
        Compare with…
      </button>

      <div className="border-t border-[#2d2d2d] my-1" />

      <button
        disabled={isOnlyBranch}
        className={`${item} ${
          isOnlyBranch
            ? "text-gray-600 cursor-not-allowed"
            : "text-red-400 hover:bg-red-500/10 hover:text-red-300"
        }`}
        onClick={() => {
          if (!isOnlyBranch) {
            onDelete();
            onClose();
          }
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="flex-shrink-0 opacity-70"
        >
          <path d="M6 2h4a1 1 0 0 0-2 0H6a1 1 0 0 0-2 0H2v1h12V2h-2a1 1 0 0 0-2 0zM3 5l1 9h8l1-9H3zm3 1h1v7H6V6zm3 0h1v7H9V6z" />
        </svg>
        Delete
      </button>
    </div>
  );
}

// ── Branch Node (tree view only) ──────────────────────────────────────────────

interface BranchNodeProps {
  node: TreeNode;
  isLast: boolean;
  ancestors: boolean[];
  onContextMenu: (id: string, x: number, y: number) => void;
}

function BranchNode({
  node,
  isLast,
  ancestors,
  onContextMenu,
}: BranchNodeProps) {
  const { currentBranchId, setCurrentBranch } = useResumeStore();
  const isActive = currentBranchId === node.branch.id;
  const color = BRANCH_COLORS[node.colorIndex];
  const ellipsisRef = useRef<HTMLButtonElement>(null);

  function handleEllipsisClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = ellipsisRef.current?.getBoundingClientRect();
    if (rect) {
      onContextMenu(node.branch.id, rect.left + 5, rect.bottom - 8);
    }
  }

  return (
    <div className="select-none">
      <div
        className="flex items-center h-8 group"
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(node.branch.id, e.clientX, e.clientY);
        }}
      >
        {/* Ancestor pipe lines */}
        {ancestors.map((hasMore, i) => (
          <div key={i} className="flex-shrink-0 w-5 flex justify-center">
            {hasMore ? (
              <div className="w-px h-full bg-[#3a3a3a]" />
            ) : (
              <div className="w-px h-full bg-transparent" />
            )}
          </div>
        ))}

        {/* Connector from parent */}
        {node.depth > 0 && (
          <div className="flex-shrink-0 w-5 flex flex-col items-center">
            <div className="w-px flex-1 bg-[#3a3a3a]" />
            <div className="w-2.5 h-px bg-[#3a3a3a]" />
          </div>
        )}

        {/* Circle + label */}
        <button
          onClick={() => setCurrentBranch(node.branch.id)}
          className="flex items-center gap-2 px-2 py-0.5 rounded-md transition-colors hover:bg-white/5 flex-1 min-w-0 text-left"
        >
          <div
            className="flex-shrink-0 w-3 h-3 rounded-full border-2 transition-all"
            style={{
              borderColor: color,
              backgroundColor: isActive ? color : "transparent",
              boxShadow: isActive ? `0 0 6px ${color}88` : "none",
            }}
          />
          <span
            className={`text-xs font-mono truncate transition-colors ${
              isActive
                ? "text-white font-medium"
                : "text-gray-400 group-hover:text-gray-200"
            }`}
          >
            {node.branch.name}
          </span>
        </button>

        {/* Ellipsis button (visible on hover) */}
        <button
          ref={ellipsisRef}
          onClick={handleEllipsisClick}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-200 transition-all"
          title="Version options"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="14" cy="8" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Children */}
      {node.children.map((child, idx) => (
        <BranchNode
          key={child.branch.id}
          node={child}
          isLast={idx === node.children.length - 1}
          ancestors={[...ancestors, !isLast && node.depth >= 0]}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}

// ── Rename panel ──────────────────────────────────────────────────────────────

interface RenamePanelProps {
  branch: Branch;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

function RenamePanel({ branch, onCommit, onCancel }: RenamePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit(e.currentTarget.value);
    if (e.key === "Escape") onCancel();
  }

  function commit(val: string) {
    onCommit(val.trim() || branch.name);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          Rename
        </span>
        <button
          onClick={onCancel}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="px-4 pt-4 space-y-3">
        <input
          ref={inputRef}
          defaultValue={branch.name}
          className="w-full bg-[#0d0d0d] border border-indigo-500 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
          onKeyDown={handleKey}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded px-3 py-1.5 transition-colors"
            onClick={() => commit(inputRef.current?.value ?? "")}
          >
            Rename
          </button>
          <button
            className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded px-3 py-1.5 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create panel ──────────────────────────────────────────────────────────────

interface CreatePanelProps {
  parentBranch: Branch;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

function CreatePanel({ parentBranch, onCommit, onCancel }: CreatePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit(e.currentTarget.value);
    if (e.key === "Escape") onCancel();
  }

  function commit(val: string) {
    const name = val.trim();
    if (name) onCommit(name);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          New version
        </span>
        <button
          onClick={onCancel}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] text-gray-500 leading-snug">
          Copy of{" "}
          <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">
            {parentBranch.name}
          </code>
        </p>
        <input
          ref={inputRef}
          placeholder="version name…"
          className="w-full bg-[#0d0d0d] border border-indigo-500 rounded px-2 py-1.5 text-xs text-white font-mono placeholder-gray-600 focus:outline-none"
          onKeyDown={handleKey}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded px-3 py-1.5 transition-colors"
            onClick={() => commit(inputRef.current?.value ?? "")}
          >
            Create
          </button>
          <button
            className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 text-xs rounded px-3 py-1.5 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

interface BranchTreeProps {
  onCompare: (branchId: string) => void;
}

export default function BranchTree({ onCompare }: BranchTreeProps) {
  const branches = useResumeStore((s) => s.branches);
  const createBranch = useResumeStore((s) => s.createBranch);
  const renameBranch = useResumeStore((s) => s.renameBranch);
  const deleteBranch = useResumeStore((s) => s.deleteBranch);
  const tree = useMemo(() => buildTree(branches), [branches]);

  const [panel, setPanel] = useState<PanelState>({ mode: "tree" });
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const totalBranches = Object.keys(branches).length;

  const handleContextMenu = useCallback((id: string, x: number, y: number) => {
    setContextMenu({ x, y, branchId: id });
  }, []);

  function handleDelete(id: string) {
    const branch = branches[id];
    const hasChildren = Object.values(branches).some((b) => b.parentId === id);
    const msg = hasChildren
      ? `Delete "${branch.name}" and all its child versions? This cannot be undone.`
      : `Delete "${branch.name}"? This cannot be undone.`;
    if (window.confirm(msg)) {
      deleteBranch(id);
      setPanel({ mode: "tree" });
    }
  }

  if (!tree) return null;

  // ── Rename panel view ──
  if (panel.mode === "rename") {
    const branch = branches[panel.branchId];
    if (!branch) {
      setPanel({ mode: "tree" });
      return null;
    }
    return (
      <RenamePanel
        branch={branch}
        onCommit={(name) => {
          renameBranch(panel.branchId, name);
          setPanel({ mode: "tree" });
        }}
        onCancel={() => setPanel({ mode: "tree" })}
      />
    );
  }

  // ── Create panel view ──
  if (panel.mode === "create") {
    const parentBranch = branches[panel.parentId];
    if (!parentBranch) {
      setPanel({ mode: "tree" });
      return null;
    }
    return (
      <CreatePanel
        parentBranch={parentBranch}
        onCommit={(name) => {
          createBranch(name, panel.parentId);
          setPanel({ mode: "tree" });
        }}
        onCancel={() => setPanel({ mode: "tree" })}
      />
    );
  }

  // ── Tree view (default) ──
  return (
    <div className="flex flex-col h-full overflow-y-auto py-3 px-2">
      <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium px-2 mb-2">
        Versions
      </p>
      <BranchNode
        node={tree}
        isLast={true}
        ancestors={[]}
        onContextMenu={handleContextMenu}
      />

      {/* Floating context menu */}
      {contextMenu && branches[contextMenu.branchId] && (
        <ContextMenu
          state={contextMenu}
          branch={branches[contextMenu.branchId]}
          isOnlyBranch={totalBranches <= 1}
          onRename={() =>
            setPanel({ mode: "rename", branchId: contextMenu.branchId })
          }
          onCreate={() =>
            setPanel({ mode: "create", parentId: contextMenu.branchId })
          }
          onDelete={() => handleDelete(contextMenu.branchId)}
          onCompare={() => onCompare(contextMenu.branchId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
