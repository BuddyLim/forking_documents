# forking_documents

[![CI](https://github.com/BuddyLim/forking_documents/actions/workflows/ci.yml/badge.svg)](https://github.com/limkuangtar/forking_documents/actions/workflows/ci.yml)

A markdown-based resume and document editor with Git-like branching capabilities. Create documents, fork them into branches, compare diffs, and export to PDF.

**[Live Demo](https://BuddyLim.github.io/forking_documents/)**

---

## Features

- **Markdown editor** — powered by CodeMirror with syntax highlighting
- **Branch / fork documents** — create and switch between document branches
- **Diff view** — visualize changes between branches
- **PDF export** — export your document as a PDF
- **Persistent state** — document state managed via Zustand

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18, TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Editor | CodeMirror 6 |
| State | Zustand |
| Diff | diff |
| Export | html2pdf.js |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:ci` | Run tests once (used in CI) |
| `npm run preview` | Preview production build locally |

## CI/CD

Pushes to `main`/`master` trigger two workflows:

- **CI** — runs lint, tests, and build
- **Deploy** — builds and deploys to the `gh-pages` branch

GitHub Pages must have its source set to the `gh-pages` branch in repo Settings → Pages.
