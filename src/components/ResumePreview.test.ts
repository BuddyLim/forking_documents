import { describe, it, expect } from 'vitest'
import { parseFrontMatter, computePreviewScale, processEntryRows } from './ResumePreview'

// ── Preview scaling ────────────────────────────────────────────────────────────

const MM_TO_PX = 96 / 25.4
const A4_WIDTH_MM = 210
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX

describe('computePreviewScale', () => {
  it('returns 1 when container is wider than the paper', () => {
    const scale = computePreviewScale(A4_WIDTH_PX + 200, A4_WIDTH_MM)
    expect(scale).toBe(1)
  })

  it('returns 1 when container exactly fits the paper plus gutter', () => {
    const scale = computePreviewScale(A4_WIDTH_PX + 32, A4_WIDTH_MM)
    expect(scale).toBe(1)
  })

  it('scales down when container is narrower than the paper', () => {
    const containerWidth = A4_WIDTH_PX / 2 + 32
    const scale = computePreviewScale(containerWidth, A4_WIDTH_MM)
    expect(scale).toBeCloseTo(0.5, 5)
  })

  it('never returns a value greater than 1', () => {
    const scale = computePreviewScale(999999, A4_WIDTH_MM)
    expect(scale).toBeLessThanOrEqual(1)
  })

  it('accepts a custom gutter size', () => {
    const gutter = 64
    const containerWidth = A4_WIDTH_PX + gutter
    const scale = computePreviewScale(containerWidth, A4_WIDTH_MM, gutter)
    expect(scale).toBe(1)
  })
})

// ── processEntryRows: markdown link formatting ────────────────────────────────

describe('processEntryRows — markdown link [label](url)', () => {
  it('converts a bare markdown link to an anchor tag', () => {
    const result = processEntryRows('[GitHub](https://github.com) ~ Date')
    expect(result).toContain('<a href="https://github.com">GitHub</a>')
  })

  it('converts a link nested inside bold', () => {
    const result = processEntryRows('**Title** ~ **[Independent Research Project](https://github.com/BuddyLim/trilayer)**')
    expect(result).toContain('<a href="https://github.com/BuddyLim/trilayer">Independent Research Project</a>')
  })

  it('converts multiple links in the same line', () => {
    const result = processEntryRows('[A](https://a.com) ~ [B](https://b.com)')
    expect(result).toContain('<a href="https://a.com">A</a>')
    expect(result).toContain('<a href="https://b.com">B</a>')
  })

  it('does not affect lines without ~ separator', () => {
    const input = '[GitHub](https://github.com)'
    const result = processEntryRows(input)
    expect(result).toBe(input)
  })

  it('leaves plain text lines unchanged', () => {
    const input = 'No separator here'
    expect(processEntryRows(input)).toBe(input)
  })
})

// ── Flow 5: Compare Versions (content parsing) ────────────────────────────────

describe('parseFrontMatter', () => {
  it('correctly splits YAML frontmatter from markdown body', () => {
    const input = `---\nname: Jane Doe\n---\n\n## Experience\n\nSome text`
    const { fm, body } = parseFrontMatter(input)
    expect(fm).not.toBeNull()
    expect(fm?.name).toBe('Jane Doe')
    expect(body).toBe('## Experience\n\nSome text')
  })

  it('with no --- delimiters returns null frontmatter and full text as body', () => {
    const input = 'Just plain markdown\n\nNo frontmatter here'
    const { fm, body } = parseFrontMatter(input)
    expect(fm).toBeNull()
    expect(body).toBe(input)
  })
})
