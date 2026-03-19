import { useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useResumeStore, DEFAULT_FORMAT } from "./store/useResumeStore";
import InitModal from "./components/InitModal";
import TopBar from "./components/TopBar";
import BranchTree from "./components/BranchTree";
import MarkdownEditor from "./components/MarkdownEditor";
import ResumePreview from "./components/ResumePreview";
import FormatPanel from "./components/FormatPanel";
import DiffModal from "./components/DiffModal";

export default function App() {
  const previewRef = useRef<HTMLDivElement>(null!);
  const [formatOpen, setFormatOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [diffBranchId, setDiffBranchId] = useState<string | null>(null);
  const { branches, currentBranchId } = useResumeStore();

  const hasRoot = Object.values(branches).some((b) => b.parentId === null);
  const currentBranch = currentBranchId ? branches[currentBranchId] : null;

  const handleExport = () => {
    if (!previewRef.current || !currentBranch) return;

    const fmt = currentBranch.format ?? DEFAULT_FORMAT;
    const pdfTitle = fmt.pdfTitle.trim() || currentBranch.name;

    // Temporarily override document title — Chrome uses it as the PDF filename/title
    const prevTitle = document.title;
    document.title = pdfTitle;

    // ── Compute page geometry (same formula as ResumePreview) ─────────────────
    const PAPER_HEIGHTS_MM: Record<string, number> = { a4: 297, letter: 279.4, legal: 355.6 };
    const PAPER_WIDTHS_CSS: Record<string, string>  = { a4: "210mm", letter: "215.9mm", legal: "215.9mm" };
    const MM_TO_PX = 96 / 25.4;

    const paperHeightMm       = PAPER_HEIGHTS_MM[fmt.paperSize] ?? 297;
    const paperWidthCss       = PAPER_WIDTHS_CSS[fmt.paperSize] ?? "210mm";
    const marginVPx           = fmt.marginV * MM_TO_PX;
    const pageContentHeightMm = Math.max(1, paperHeightMm - 2 * fmt.marginV);
    const pageContentHeightPx = pageContentHeightMm * MM_TO_PX;
    const contentOnlyPx       = Math.max(0, previewRef.current.scrollHeight - 2 * marginVPx);
    const pageCount           = Math.max(1, Math.ceil(contentOnlyPx / pageContentHeightPx));

    // ── Print stylesheet ───────────────────────────────────────────────────────
    // Use @page { margin: 0 } and reproduce the preview's clip-zone structure
    // in the print DOM so the printed output matches the on-screen preview
    // pixel-for-pixel (same margins, same page break positions).
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page { size: ${fmt.paperSize}; margin: 0; }
        html, body { height: auto !important; overflow: visible !important; background: white; }
        body > * { display: none !important; }
        #__resume_print__ { display: block !important; }
        .resume-print-page {
          width: ${paperWidthCss};
          height: ${paperHeightMm}mm;
          overflow: hidden;
          position: relative;
          background: white;
          page-break-after: always;
          break-after: page;
        }
        .resume-print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .resume-print-clip {
          position: absolute;
          top: ${fmt.marginV}mm;
          bottom: ${fmt.marginV}mm;
          left: 0;
          right: 0;
          overflow: hidden;
        }
        .resume-print-page .resume-body {
          position: absolute !important;
          left: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          box-shadow: none !important;
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    // ── Build print DOM ────────────────────────────────────────────────────────
    // One page-wrapper per page; each mirrors the preview's clip-zone structure:
    //   page card  →  clip zone (overflow:hidden, inset by marginV)
    //              →  full content shifted up by (marginV + i·pageContentH)
    const printDiv = document.createElement("div");
    printDiv.id = "__resume_print__";
    printDiv.style.display = "none";

    const staleProps = ["position", "top", "left", "visibility", "pointer-events", "z-index", "width", "max-width"];

    for (let i = 0; i < pageCount; i++) {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "resume-print-page";

      const clipZone = document.createElement("div");
      clipZone.className = "resume-print-clip";

      // Clone the hidden measurement div (carries all content + scoped styles)
      const contentClone = previewRef.current.cloneNode(true) as HTMLElement;
      staleProps.forEach((p) => contentClone.style.removeProperty(p));

      // Shift the content so that this page's slice is visible through the clip zone
      contentClone.style.top = `-${fmt.marginV + i * pageContentHeightMm}mm`;

      clipZone.appendChild(contentClone);
      pageWrapper.appendChild(clipZone);
      printDiv.appendChild(pageWrapper);
    }

    document.body.appendChild(printDiv);

    // Clean up after the print dialog closes (cancel or save)
    const cleanup = () => {
      document.title = prevTitle;
      style.remove();
      printDiv.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {!hasRoot && <InitModal />}

      <TopBar
        onExport={handleExport}
        onToggleFormat={() => setFormatOpen((o) => !o)}
        onToggleBranch={() => setBranchOpen((o) => !o)}
        formatOpen={formatOpen}
        branchOpen={branchOpen}
      />

      {/* Main area: panels + slide-in format drawer */}
      <div className="relative flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Backdrop overlay to close branch panel on outside click */}
          {branchOpen && (
            <div
              className="absolute inset-0 z-10"
              onClick={() => setBranchOpen(false)}
            />
          )}
          {/* Branch tree */}
          <div
            className={`absolute top-0 left-0 bottom-0 w-64 bg-[#141414] border-l border-[#2d2d2d] z-20 transition-transform duration-200 ease-in-out ${
              branchOpen ? "translate-x-0" : "translate-x-[-100%]"
            }`}
          >
            <Panel defaultSize={18} minSize={14} maxSize={28}>
              <div className="h-full bg-[#141414] border-r border-[#2d2d2d]">
                <BranchTree onCompare={(id) => { setDiffBranchId(id); setBranchOpen(false); }} />
              </div>
            </Panel>
          </div>

          <PanelResizeHandle className="w-1 bg-[#2d2d2d] hover:bg-indigo-500 transition-colors cursor-col-resize" />

          {/* Editor */}
          <Panel defaultSize={42} minSize={20}>
            <MarkdownEditor />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2d2d2d] hover:bg-indigo-500 transition-colors cursor-col-resize" />

          {/* Preview */}
          <Panel defaultSize={40} minSize={20}>
            <div className="relative h-full">
              <ResumePreview previewRef={previewRef} />
              {diffBranchId && (
                <DiffModal
                  baseBranchId={diffBranchId}
                  onClose={() => setDiffBranchId(null)}
                />
              )}
            </div>
          </Panel>
        </PanelGroup>

        {/* Format panel — slides in from the right, overlays the preview */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-64 bg-[#141414] border-l border-[#2d2d2d] z-20 transition-transform duration-200 ease-in-out ${
            formatOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <FormatPanel />
        </div>
      </div>
    </div>
  );
}
