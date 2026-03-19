import { describe, it, expect, beforeEach } from 'vitest'
import { useResumeStore } from './useResumeStore'

const reset = () =>
  useResumeStore.setState({ branches: {}, currentBranchId: null })

beforeEach(reset)

// ── Flow 1: Initialize App ────────────────────────────────────────────────────

describe('initRoot', () => {
  it('creates a branch with the given name and starter content', () => {
    useResumeStore.getState().initRoot('My Resume', 'Hello world')
    const { branches, currentBranchId } = useResumeStore.getState()
    expect(currentBranchId).toBeTruthy()
    const branch = branches[currentBranchId!]
    expect(branch.name).toBe('My Resume')
    expect(branch.content).toBe('Hello world')
    expect(branch.parentId).toBeNull()
  })

  it('with empty string name still creates a branch without crashing', () => {
    expect(() => useResumeStore.getState().initRoot('', '')).not.toThrow()
    const { branches, currentBranchId } = useResumeStore.getState()
    expect(currentBranchId).toBeTruthy()
    expect(branches[currentBranchId!]).toBeDefined()
  })
})

// ── Flow 3: Create Version Fork ───────────────────────────────────────────────

describe('createBranch', () => {
  it('inherits parent content and format settings', () => {
    useResumeStore.getState().initRoot('Base', 'Base content')
    const parentId = useResumeStore.getState().currentBranchId!
    useResumeStore.getState().updateFormat(parentId, { fontSize: 16 })

    useResumeStore.getState().createBranch('Fork', parentId)
    const { branches, currentBranchId } = useResumeStore.getState()
    const fork = branches[currentBranchId!]
    expect(fork.content).toBe('Base content')
    expect(fork.format.fontSize).toBe(16)
    expect(fork.parentId).toBe(parentId)
  })

  it('with a non-existent parentId does not add a branch to state', () => {
    useResumeStore.getState().initRoot('Base', 'content')
    const before = Object.keys(useResumeStore.getState().branches).length

    useResumeStore.getState().createBranch('Ghost', 'nonexistent-id')
    const after = Object.keys(useResumeStore.getState().branches).length
    expect(after).toBe(before)
  })
})

// ── Flow 2: Edit Document ─────────────────────────────────────────────────────

describe('updateContent', () => {
  it('updates the correct branch content', () => {
    useResumeStore.getState().initRoot('Resume', 'original')
    const id = useResumeStore.getState().currentBranchId!

    useResumeStore.getState().updateContent(id, 'updated')
    expect(useResumeStore.getState().branches[id].content).toBe('updated')
  })

  it('with unknown branch ID leaves state unchanged', () => {
    useResumeStore.getState().initRoot('Resume', 'original')
    const before = { ...useResumeStore.getState().branches }

    useResumeStore.getState().updateContent('ghost-id', 'nope')
    expect(useResumeStore.getState().branches).toEqual(before)
  })
})

// ── Flow 4: Customize Formatting ──────────────────────────────────────────────

describe('updateFormat', () => {
  it('merges a partial patch onto existing format settings', () => {
    useResumeStore.getState().initRoot('Resume', '')
    const id = useResumeStore.getState().currentBranchId!
    const originalFontFamily = useResumeStore.getState().branches[id].format.fontFamily

    useResumeStore.getState().updateFormat(id, { fontSize: 18 })
    const fmt = useResumeStore.getState().branches[id].format
    expect(fmt.fontSize).toBe(18)
    expect(fmt.fontFamily).toBe(originalFontFamily)
  })

  it('with unknown branch ID leaves all formats unchanged', () => {
    useResumeStore.getState().initRoot('Resume', '')
    const before = { ...useResumeStore.getState().branches }

    useResumeStore.getState().updateFormat('ghost-id', { fontSize: 99 })
    expect(useResumeStore.getState().branches).toEqual(before)
  })
})

// ── Flow 7: Rename Branch ─────────────────────────────────────────────────────

describe('renameBranch', () => {
  it('updates the branch name correctly', () => {
    useResumeStore.getState().initRoot('Old Name', '')
    const id = useResumeStore.getState().currentBranchId!

    useResumeStore.getState().renameBranch(id, 'New Name')
    expect(useResumeStore.getState().branches[id].name).toBe('New Name')
  })

  it('with unknown branch ID leaves all names unchanged', () => {
    useResumeStore.getState().initRoot('Original', '')
    const before = { ...useResumeStore.getState().branches }

    useResumeStore.getState().renameBranch('ghost-id', 'Renamed')
    expect(useResumeStore.getState().branches).toEqual(before)
  })
})

// ── Flow 8: Delete Branch ─────────────────────────────────────────────────────

describe('deleteBranch', () => {
  it('removes the branch and all its descendants', () => {
    useResumeStore.getState().initRoot('Root', '')
    const rootId = useResumeStore.getState().currentBranchId!

    useResumeStore.getState().createBranch('Child', rootId)
    const childId = useResumeStore.getState().currentBranchId!

    useResumeStore.getState().deleteBranch(childId)
    expect(useResumeStore.getState().branches[childId]).toBeUndefined()
    expect(useResumeStore.getState().branches[rootId]).toBeDefined()
  })

  it('on the only branch does not remove it (guard)', () => {
    useResumeStore.getState().initRoot('Only', '')
    const id = useResumeStore.getState().currentBranchId!

    useResumeStore.getState().deleteBranch(id)
    expect(useResumeStore.getState().branches[id]).toBeDefined()
  })
})
