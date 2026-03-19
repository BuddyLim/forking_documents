import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { useResumeStore } from "../store/useResumeStore";
import { keymap } from "@codemirror/view";
import { lineNumbersRelative } from "@uiw/codemirror-extensions-line-numbers-relative";

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "12px",
    backgroundColor: "transparent !important",
  },
  ".cm-editor": {
    backgroundColor: "transparent !important",
  },
  ".cm-scroller": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    lineHeight: "1.75",
    overflow: "auto",
    backgroundColor: "transparent !important",
  },
  ".cm-content": {
    padding: "16px",
    caretColor: "#a5b4fc",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "0 2px",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    borderRight: "1px solid #2d2d2d",
    color: "#4a4a4a",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important",
    color: "#888",
  },
  ".cm-cursor": {
    borderLeftColor: "#a5b4fc",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "#3730a3 !important",
  },
});

// ── Syntax cheatsheet popover ─────────────────────────────────────────────────

function SyntaxHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-5 h-5 rounded-full border text-[10px] font-semibold flex items-center justify-center transition-colors ${
          open
            ? "border-indigo-400 text-indigo-400 bg-indigo-500/10"
            : "border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300"
        }`}
        title="Syntax help"
      >
        ?
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-30 w-80 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl p-4 space-y-4 text-[11px]">
          {/* YAML header */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
              Structured header
            </p>
            <p className="text-gray-400 mb-2 leading-relaxed">
              Use a YAML frontmatter block at the top of your document to render
              a centered name + contact row header.
            </p>
            <pre className="bg-[#111] rounded p-2.5 text-gray-300 leading-relaxed overflow-x-auto">{`---
name: Jane Doe
header:
  - text: jane@email.com
    link: mailto:jane@email.com
  - text: linkedin.com/in/jane
    link: https://linkedin.com/in/jane
  - text: GitHub
    link: https://github.com/jane
    newLine: true
---`}</pre>
            <p className="text-gray-500 mt-2 leading-relaxed">
              Items on the same row are separated by{" "}
              <span className="text-gray-300 font-mono bg-[#222] px-1 rounded">
                ·
              </span>
              . Use{" "}
              <span className="text-gray-300 font-mono bg-[#222] px-1 rounded">
                newLine: true
              </span>{" "}
              to start a new row.
            </p>
          </section>

          <div className="border-t border-[#2d2d2d]" />

          {/* Tilde rows */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
              Entry rows{" "}
              <span className="normal-case text-gray-600">
                (tilde separator)
              </span>
            </p>
            <p className="text-gray-400 mb-2 leading-relaxed">
              Separate parts of a line with{" "}
              <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">
                {" "}
                ~{" "}
              </span>{" "}
              to create left / center / right columns.
            </p>
            <pre className="bg-[#111] rounded p-2.5 text-gray-300 leading-relaxed overflow-x-auto">{`**Software Engineer** ~ Acme Corp ~ *2022–Present*`}</pre>
            <div className="mt-2 space-y-1 text-gray-500">
              <p>2 parts → left · right</p>
              <p>3 parts → left · center · right</p>
              <p>
                Supports{" "}
                <span className="font-mono text-gray-400">**bold**</span> within
                each part.
              </p>
            </div>
          </section>

          <div className="border-t border-[#2d2d2d]" />

          {/* Standard markdown reminder */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
              Headings
            </p>
            <div className="space-y-1 text-gray-400 font-mono">
              <p>
                <span className="text-indigo-400">#</span> Name (H1)
              </p>
              <p>
                <span className="text-indigo-400">##</span> Section (H2)
              </p>
              <p>
                <span className="text-indigo-400">###</span> Role / item (H3)
              </p>
            </div>
          </section>

          <div className="border-t border-[#2d2d2d]" />

          {/* Privacy note */}
          <p className="text-gray-600 leading-relaxed">
            <span className="text-gray-500">&#x1F512;</span> All data is saved
            exclusively in your browser's local storage. Nothing is sent to any
            server.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Formatting toolbar ────────────────────────────────────────────────────────

/** Toggle an inline marker (e.g. "**") around the current selection.
 *  - If selection already has the marker, strips it.
 *  - If nothing is selected, inserts marker·marker and places cursor between.
 */
function toggleInlineMarker(view: EditorView, marker: string) {
  const { state } = view;
  const range = state.selection.main;
  const selected = state.sliceDoc(range.from, range.to);
  const mLen = marker.length;

  // Check if already wrapped
  if (
    selected.startsWith(marker) &&
    selected.endsWith(marker) &&
    selected.length >= mLen * 2
  ) {
    // Unwrap
    const inner = selected.slice(mLen, selected.length - mLen);
    view.dispatch({
      changes: { from: range.from, to: range.to, insert: inner },
      selection: { anchor: range.from, head: range.from + inner.length },
    });
    return;
  }

  // Also check if the chars just outside the selection are the marker
  const before = state.sliceDoc(Math.max(0, range.from - mLen), range.from);
  const after = state.sliceDoc(
    range.to,
    Math.min(state.doc.length, range.to + mLen),
  );
  if (before === marker && after === marker) {
    view.dispatch({
      changes: [
        { from: range.from - mLen, to: range.from, insert: "" },
        { from: range.to, to: range.to + mLen, insert: "" },
      ],
      selection: { anchor: range.from - mLen, head: range.to - mLen },
    });
    return;
  }

  if (selected.length === 0) {
    // No selection — insert markers and place cursor inside
    const insert = marker + marker;
    view.dispatch({
      changes: { from: range.from, to: range.to, insert },
      selection: { anchor: range.from + mLen },
    });
  } else {
    // Wrap selection
    view.dispatch({
      changes: {
        from: range.from,
        to: range.to,
        insert: marker + selected + marker,
      },
      selection: {
        anchor: range.from,
        head: range.from + mLen + selected.length + mLen,
      },
    });
  }

  view.focus();
}

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ToolbarButton({
  onClick,
  title,
  children,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={(e) => {
        // Prevent the editor from losing focus when clicking the toolbar
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-100 hover:bg-white/8 transition-colors text-xs ${className}`}
    >
      {children}
    </button>
  );
}

function FormattingToolbar({
  viewRef,
}: {
  viewRef: React.RefObject<EditorView | null>;
}) {
  const apply = (marker: string) => {
    if (viewRef.current) toggleInlineMarker(viewRef.current, marker);
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-[#2d2d2d]">
      <ToolbarButton onClick={() => apply("**")} title="Bold — Cmd/Ctrl+B">
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => apply("*")} title="Italic — Cmd/Ctrl+I">
        <span className="italic font-serif">I</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => apply("~~")}
        title="Strikethrough — Cmd/Ctrl+Shift+S"
      >
        <span className="line-through">S</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => apply("`")}
        title="Inline code — Cmd/Ctrl+E"
      >
        <span className="font-mono text-[11px]">`</span>
      </ToolbarButton>

      <div className="w-px h-4 bg-[#333] mx-1" />

      <ToolbarButton
        onClick={() => {
          const view = viewRef.current;
          if (!view) return;
          const { state } = view;
          const range = state.selection.main;
          const selected = state.sliceDoc(range.from, range.to);
          const insert = selected ? `[${selected}](url)` : "[text](url)";
          const cursorAt = range.from + (selected ? selected.length + 3 : 1);
          view.dispatch({
            changes: { from: range.from, to: range.to, insert },
            selection: { anchor: range.from + 1, head: cursorAt },
          });
          view.focus();
        }}
        title="Link"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 3.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 0 0-3h-3zM3 5a3 3 0 1 1 6 0H7a1.5 1.5 0 0 0-3 0v.5H3V5zm7 6a1.5 1.5 0 0 0 0-3h-3a1.5 1.5 0 0 0 0 3h3zm-3-4.5h2A3 3 0 1 1 6 11h1.5A1.5 1.5 0 0 0 9 9.5V9h1v.5z" />
          <path d="M5.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5z" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────

export default function MarkdownEditor() {
  const currentBranchId = useResumeStore((s) => s.currentBranchId);
  const branches = useResumeStore((s) => s.branches);
  const updateContent = useResumeStore((s) => s.updateContent);

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<string>("");

  const content = currentBranchId
    ? (branches[currentBranchId]?.content ?? "")
    : "";

  useEffect(() => {
    if (!editorRef.current || !currentBranchId) return;

    // Destroy previous instance
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    contentRef.current = content;

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        oneDark,
        editorTheme,
        lineNumbersRelative,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([
          {
            key: "Mod-b",
            run: (view) => {
              toggleInlineMarker(view, "**");
              return true;
            },
          },
          {
            key: "Mod-i",
            run: (view) => {
              toggleInlineMarker(view, "*");
              return true;
            },
          },
          {
            key: "Mod-e",
            run: (view) => {
              toggleInlineMarker(view, "`");
              return true;
            },
          },
          {
            key: "Mod-Shift-s",
            run: (view) => {
              toggleInlineMarker(view, "~~");
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const value = update.state.doc.toString();
          contentRef.current = value;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            updateContent(currentBranchId, value);
          }, 300);
        }),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({ state, parent: editorRef.current });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [currentBranchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external content changes (e.g. branch switch) without reinitializing
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (content === contentRef.current) return;
    contentRef.current = content;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }, [content]);

  if (!currentBranchId) return null;

  return (
    <div className="flex flex-col h-full pl-2 py-4 bg-[#262624]">
      <div className="flex items-center px-4 py-2 border-b border-[#2d2d2d]">
        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">
          Editor
        </span>
        <SyntaxHelp />
      </div>
      <FormattingToolbar viewRef={viewRef} />
      <div ref={editorRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
