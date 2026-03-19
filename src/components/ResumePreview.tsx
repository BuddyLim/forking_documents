import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import yaml from "js-yaml";
import { useResumeStore, DEFAULT_FORMAT } from "../store/useResumeStore";
import "../styles/resume.css";

// Iconify is loaded as a global script in index.html.
// After React re-renders, we ask it to re-scan the DOM for new iconify spans.
declare global {
  interface Window {
    Iconify?: { scan: (root?: Element) => void };
  }
}

// ── YAML frontmatter types ────────────────────────────────────────────────────

interface HeaderItem {
  text: string;
  link?: string;
  newLine?: boolean;
}

interface FrontMatter {
  name?: string;
  header?: HeaderItem[];
}

export function parseFrontMatter(raw: string): {
  fm: FrontMatter | null;
  body: string;
} {
  const trimmed = raw.trimStart();
  const m = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: null, body: raw };
  try {
    const fm = yaml.load(m[1]) as FrontMatter;
    return { fm, body: m[2].trim() };
  } catch (e) {
    console.warn("[ResumePreview] YAML parse error:", e);
    return { fm: null, body: raw };
  }
}

// Convert lines containing " ~ " separators into three-column flex rows.
// Supports 2 parts (left · right) or 3 parts (left · center · right).
// Markdown bold (**text**) within each part is converted to <strong>.
function processEntryRows(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => {
      if (!line.includes(" ~ ")) return line;
      const parts = line.split(" ~ ");
      if (parts.length < 2) return line;
      const toHtml = (s: string) =>
        s.trim().replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const colClass = (i: number) => {
        if (parts.length === 2) return i === 0 ? "entry-left" : "entry-right";
        return i === 0 ? "entry-left" : i === 1 ? "entry-center" : "entry-right";
      };
      const spans = parts
        .map((p, i) => `<span class="${colClass(i)}">${toHtml(p)}</span>`)
        .join("");
      return `<div class="resume-entry-row">${spans}</div>`;
    })
    .join("\n");
}

// Build the header as an HTML string so it flows through the existing
// ReactMarkdown + rehype-raw pipeline (avoids dangerouslySetInnerHTML).
function buildHeaderHtml(fm: FrontMatter): string {
  const parts: string[] = ['<div class="resume-header">'];

  if (fm.name) {
    parts.push(`<h1>${fm.name}</h1>`);
  }

  const items = fm.header ?? [];

  // Group items into rows split on newLine:true
  const rows: HeaderItem[][] = [];
  let row: HeaderItem[] = [];
  for (const item of items) {
    if (item.newLine && row.length > 0) {
      rows.push(row);
      row = [item];
    } else {
      row.push(item);
    }
  }
  if (row.length > 0) rows.push(row);

  for (const r of rows) {
    const cells = r.map((item, i) => {
      const sep = i > 0 ? '<span class="resume-header-sep"> · </span>' : "";
      const text = item.text.trim();
      const content = item.link
        ? `<a href="${item.link}">${text}</a>`
        : `<span>${text}</span>`;
      return sep + content;
    });
    parts.push(`<div class="resume-header-row">${cells.join("")}</div>`);
  }

  parts.push("</div>");
  return parts.join("\n");
}

// ── Preview ───────────────────────────────────────────────────────────────────

const PAPER_MAX_WIDTH: Record<string, string> = {
  a4: "210mm",
  letter: "215.9mm",
  legal: "215.9mm",
};

// Paper widths in millimetres (mirrors PAPER_MAX_WIDTH, used for scale calc)
const PAPER_WIDTHS_MM: Record<string, number> = {
  a4: 210,
  letter: 215.9,
  legal: 215.9,
};

// Paper heights in millimetres (used to calculate page count and page card height)
const PAPER_HEIGHTS_MM: Record<string, number> = {
  a4: 297,
  letter: 279.4, // 11 inches
  legal: 355.6, // 14 inches
};

// CSS reference pixel density: 1 inch = 96 px, so 1 mm = 96/25.4 px
const MM_TO_PX = 96 / 25.4;

// Compute the scale factor needed to fit a paper-width card inside a container.
// Never scales above 1 (only shrinks, never enlarges).
export function computePreviewScale(
  containerWidthPx: number,
  paperWidthMm: number,
  gutterPx = 32,
): number {
  const paperWidthPx = paperWidthMm * MM_TO_PX;
  return Math.min(1, (containerWidthPx - gutterPx) / paperWidthPx);
}

interface ResumePreviewProps {
  previewRef: React.RefObject<HTMLDivElement>;
}

export default function ResumePreview({ previewRef }: ResumePreviewProps) {
  const currentBranchId = useResumeStore((s) => s.currentBranchId);
  const branches = useResumeStore((s) => s.branches);

  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1);
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  const branch = currentBranchId ? branches[currentBranchId] : null;
  const rawContent = branch?.content ?? "";
  const fmt = branch?.format ?? DEFAULT_FORMAT;

  const paperHeightMm = PAPER_HEIGHTS_MM[fmt.paperSize] ?? 297;
  const paperWidthMm = PAPER_WIDTHS_MM[fmt.paperSize] ?? 210;

  // The usable content area on each printed page, after subtracting both
  // top and bottom margins.  Clamped to ≥1 to avoid division-by-zero.
  const pageContentHeightMm = Math.max(1, paperHeightMm - 2 * fmt.marginV);
  const pageContentHeightPx = pageContentHeightMm * MM_TO_PX;
  const marginVPx = fmt.marginV * MM_TO_PX;

  // Watch the hidden measurement div and recalculate page count whenever
  // content height changes (user typing, format settings change, etc.)
  //
  // Page count = ⌈ content-only height / page content area ⌉
  //   • content-only height  = scrollHeight − top margin − bottom margin
  //   • page content area    = paperHeight  − top margin − bottom margin
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      const contentOnlyPx = Math.max(0, el.scrollHeight - 2 * marginVPx);
      setPageCount(Math.max(1, Math.ceil(contentOnlyPx / pageContentHeightPx)));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [previewRef, pageContentHeightPx, marginVPx]);

  // Scale page cards to fit the available container width (like object-fit: contain)
  useEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;
    const update = () => {
      setScale(computePreviewScale(container.clientWidth, paperWidthMm));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(container);
    return () => obs.disconnect();
  }, [paperWidthMm]);

  // Re-scan for Iconify spans in both the hidden div and visible page cards
  useEffect(() => {
    if (!window.Iconify) return;
    if (previewRef.current) window.Iconify.scan(previewRef.current);
    if (pagesContainerRef.current)
      window.Iconify.scan(pagesContainerRef.current);
  });

  if (!currentBranchId) return null;

  const { fm, body } = parseFrontMatter(rawContent);

  // Prepend the rendered header HTML so rehype-raw handles it the same way
  // as the rest of the markdown content.
  const hasHeader = fm && (fm.name || (fm.header && fm.header.length > 0));
  const processedBody = processEntryRows(body);
  const fullContent = hasHeader
    ? `${buildHeaderHtml(fm!)}\n\n${processedBody}`
    : processEntryRows(rawContent);

  const paperWidthCss = PAPER_MAX_WIDTH[fmt.paperSize] ?? "210mm";

  // Base styles shared by the hidden div and each visible page card's content
  const bodyStyle: React.CSSProperties = {
    fontFamily: fmt.fontFamily,
    fontSize: `${fmt.fontSize}px`,
    lineHeight: fmt.lineHeight,
    padding: `${fmt.marginV}mm ${fmt.marginH}mm`,
  };

  const ac = fmt.accentColor ?? "#111111";
  const scopedStyles = `
    [data-resume="${currentBranchId}"] p                { margin-bottom: ${fmt.paragraphSpacing}em !important; }
    [data-resume="${currentBranchId}"] .resume-entry-row{ margin-bottom: ${fmt.paragraphSpacing}em !important; }
    [data-resume="${currentBranchId}"] li               { margin-bottom: ${fmt.paragraphSpacing * 0.4}em !important; }
    [data-resume="${currentBranchId}"] h1               { color: ${ac} !important; }
    [data-resume="${currentBranchId}"] .resume-header h1{ color: ${ac} !important; }
    [data-resume="${currentBranchId}"] h2               { color: ${ac} !important; border-bottom-color: ${ac} !important; }
  `;

  // Content rendered identically in both the hidden measurement div and each
  // visible page card (same markdown, same scoped styles, same branch id).
  const contentJsx = (
    <>
      <style>{scopedStyles}</style>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{fullContent}</ReactMarkdown>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-[#d4d4d4]">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center px-4 py-2 border-b border-[#c8c8c8] bg-[#e0e0e0] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          Preview
        </span>
        {pageCount > 1 && (
          <span className="ml-auto text-[10px] text-gray-400">
            {pageCount} pages
          </span>
        )}
      </div>

      {/* ── Hidden measurement div ─────────────────────────────────────────── */}
      {/* Rendered off-screen so we get an accurate scrollHeight for page count
          calculation, and so App.tsx can clone it for PDF/print export. */}
      <div
        ref={previewRef}
        className="resume-body"
        data-resume={currentBranchId}
        style={{
          ...bodyStyle,
          width: paperWidthCss,
          maxWidth: paperWidthCss,
          position: "fixed",
          top: "-99999px",
          left: "0",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -9999,
        }}
      >
        {contentJsx}
      </div>

      {/* ── Paginated page cards ───────────────────────────────────────────── */}
      <div
        ref={pagesContainerRef}
        className="flex-1 overflow-y-auto py-6 flex flex-col items-center gap-4"
      >
        {Array.from({ length: pageCount }, (_, i) => {
          const cardWidthPx = paperWidthMm * MM_TO_PX;
          const cardHeightPx = paperHeightMm * MM_TO_PX;
          return (
            // ── Scale wrapper ─────────────────────────────────────────────────
            // Occupies the scaled footprint in the flex layout so gap / scroll
            // work correctly, while the inner card renders at full paper size
            // and is shrunk via transform.
            <div
              key={i}
              style={{
                width: cardWidthPx * scale,
                height: cardHeightPx * scale,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* ── Page card ──────────────────────────────────────────────────
                  White background provides the top & bottom margin gutter.
                  Scaled down to fit the container width.                      */}
              <div
                style={{
                  width: cardWidthPx,
                  height: cardHeightPx,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                  background: "white",
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)",
                }}
              >
                {/* ── Clip zone ────────────────────────────────────────────────
                    Spans only the content area between the top and bottom margins.
                    Content outside this band (i.e. the gutter) stays hidden while
                    the surrounding white card acts as the visible margin.      */}
                <div
                  style={{
                    position: "absolute",
                    top: `${fmt.marginV}mm`,
                    bottom: `${fmt.marginV}mm`,
                    left: 0,
                    right: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* The full content is shifted so that page i's slice aligns
                      with the top of this clip zone.
                      Derivation:
                        clip-zone y=0  ↔  hidden-div y = marginV + i·pageContentH
                        ∴ content top  = −(marginV + i·pageContentH)          */}
                  <div
                    className="resume-body"
                    data-resume={currentBranchId}
                    style={{
                      ...bodyStyle,
                      position: "absolute",
                      top: `${-(fmt.marginV + i * pageContentHeightMm)}mm`,
                      left: 0,
                      width: "100%",
                      maxWidth: "100%",
                      margin: 0,
                      boxShadow: "none",
                    }}
                  >
                    {contentJsx}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
