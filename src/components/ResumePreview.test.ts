import { describe, it, expect } from 'vitest'
import { parseFrontMatter, computePreviewScale } from './ResumePreview'

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
