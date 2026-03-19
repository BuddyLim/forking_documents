import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FormatSettings {
  paperSize: "a4" | "letter" | "legal";
  fontFamily: string;
  fontSize: number; // px
  marginH: number; // mm — left & right
  marginV: number; // mm — top & bottom
  paragraphSpacing: number; // em
  lineHeight: number; // unitless
  accentColor: string; // hex — name, section headings, heading underline
  pdfTitle: string; // document title shown in Chrome PDF viewer
  pdfAuthor: string; // author metadata
}

export const DEFAULT_FORMAT: FormatSettings = {
  paperSize: "a4",
  fontFamily: '"Georgia", "Times New Roman", serif',
  fontSize: 13,
  marginH: 20,
  marginV: 24,
  paragraphSpacing: 0.5,
  lineHeight: 1.6,
  accentColor: "#111111",
  pdfTitle: "",
  pdfAuthor: "",
};

export interface Branch {
  id: string;
  name: string;
  parentId: string | null;
  content: string;
  createdAt: number;
  format: FormatSettings;
}

interface ResumeStore {
  branches: Record<string, Branch>;
  currentBranchId: string | null;
  // actions
  initRoot: (name: string, content: string) => void;
  createBranch: (
    name: string,
    parentId: string,
    // pdfTitle: string,
    // pdfAuthor: string,
  ) => void;
  setCurrentBranch: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  updateFormat: (id: string, patch: Partial<FormatSettings>) => void;
  renameBranch: (id: string, name: string) => void;
  deleteBranch: (id: string) => void;
}

const STARTER_TEMPLATE = `---
name: Jane Doe
header:
  - text: jane@email.com
    link: mailto:jane@email.com
  - text: linkedin.com/in/janedoe
    link: https://linkedin.com/in/janedoe
  - text: github.com/janedoe
    link: https://github.com/janedoe
  - text: San Francisco, CA
    newLine: true
---

## Experience

**Senior Software Engineer** ~ Acme Corp ~ *Jan 2022 – Present*

- Led migration of monolithic backend to microservices, reducing p99 latency by 40%
- Mentored a team of 4 engineers and introduced structured code review practices
- Designed and shipped a real-time notification system serving 2M+ daily active users

**Software Engineer** ~ Bright Systems ~ *Jun 2019 – Dec 2021*

- Built and maintained RESTful APIs in Go powering the company's core data pipeline
- Reduced CI build times from 18 min to 4 min by parallelising test suites and caching layers
- Collaborated with product and design to deliver a self-service analytics dashboard

**Junior Developer** ~ Startup XYZ ~ *Sep 2017 – May 2019*

- Developed customer-facing React features used by 50k+ users
- Automated deploy workflows with GitHub Actions, cutting release cycle from weekly to daily


## Education

**B.Sc. Computer Science** ~ State University ~ *2013 – 2017*

Graduated with honours · GPA 3.8 / 4.0


## Skills

**Languages:** TypeScript, Go, Python, SQL

**Tools & Platforms:** React, Node.js, PostgreSQL, Redis, Docker, Kubernetes, AWS

**Practices:** System design, CI/CD, agile, technical writing
`;

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      branches: {},
      currentBranchId: null,

      initRoot: (name, content) => {
        const id = crypto.randomUUID();
        const root: Branch = {
          id,
          name,
          parentId: null,
          content: content || STARTER_TEMPLATE,
          createdAt: Date.now(),
          format: { ...DEFAULT_FORMAT },
        };
        set({ branches: { [id]: root }, currentBranchId: id });
      },

      createBranch: (name, parentId) => {
        const id = crypto.randomUUID();
        set((state) => {
          const parent = state.branches[parentId];
          if (!parent) return state;
          const newBranch: Branch = {
            id,
            name,
            parentId,
            content: parent.content,
            createdAt: Date.now(),
            // inherit parent format so the fork starts identical
            format: {
              ...parent.format,
            },
          };
          return {
            branches: { ...state.branches, [id]: newBranch },
            currentBranchId: id,
          };
        });
      },

      setCurrentBranch: (id) => set({ currentBranchId: id }),

      updateContent: (id, content) =>
        set((state) => {
          if (!state.branches[id]) return state;
          return {
            branches: {
              ...state.branches,
              [id]: { ...state.branches[id], content },
            },
          };
        }),

      updateFormat: (id, patch) =>
        set((state) => {
          if (!state.branches[id]) return state;
          return {
            branches: {
              ...state.branches,
              [id]: {
                ...state.branches[id],
                format: {
                  ...state.branches[id].format,
                  ...patch,
                },
              },
            },
          };
        }),

      renameBranch: (id, name) =>
        set((state) => {
          if (!state.branches[id]) return state;
          return {
            branches: {
              ...state.branches,
              [id]: { ...state.branches[id], name },
            },
          };
        }),

      deleteBranch: (id) =>
        set((state) => {
          // Guard: do not delete the last remaining branch
          if (Object.keys(state.branches).length <= 1) return state;
          // Collect all descendant ids recursively
          const toDelete = new Set<string>();
          const queue = [id];
          while (queue.length > 0) {
            const cur = queue.shift()!;
            toDelete.add(cur);
            Object.values(state.branches)
              .filter((b) => b.parentId === cur)
              .forEach((b) => queue.push(b.id));
          }
          const remaining = Object.fromEntries(
            Object.entries(state.branches).filter(([k]) => !toDelete.has(k)),
          );
          // If current branch is being deleted, switch to the parent (or first remaining)
          let nextCurrent = state.currentBranchId;
          if (nextCurrent && toDelete.has(nextCurrent)) {
            const parent = state.branches[id]?.parentId;
            nextCurrent =
              parent && remaining[parent]
                ? parent
                : (Object.keys(remaining)[0] ?? null);
          }
          return { branches: remaining, currentBranchId: nextCurrent };
        }),
    }),
    { name: "resume-forker-store" },
  ),
);

export { STARTER_TEMPLATE };
