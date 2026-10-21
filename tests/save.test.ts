import { describe, expect, it, vi } from 'vitest'
import { prefsSet } from '../src/platform'
import { defaultSave, load, SAVE_KEY, save, type Save } from '../src/save'

describe('save.ts (TECH §5)', () => {
  it('저장된 값이 없으면 기본값을 반환한다', async () => {
    await prefsSet(SAVE_KEY, '')
    const loaded = await load()
    expect(loaded).toEqual(defaultSave())
  })

  it('깨진 JSON이면 save_corrupt 로그를 남기고 기본값을 반환한다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await prefsSet(SAVE_KEY, '{broken_json: true')
    const loaded = await load()
    expect(loaded).toEqual(defaultSave())
    expect(warnSpy).toHaveBeenCalledWith('save_corrupt')
    warnSpy.mockRestore()
  })

  it('스키마가 손상된 JSON이면 기본값을 반환한다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await prefsSet(SAVE_KEY, JSON.stringify({ v: 1, name: 123 }))
    const loaded = await load()
    expect(loaded).toEqual(defaultSave())
    expect(warnSpy).toHaveBeenCalledWith('save_corrupt')
    warnSpy.mockRestore()
  })

  it('저장 후 다시 불러오면 같은 값을 반환한다', async () => {
    const custom: Save = {
      v: 1,
      name: '박일병',
      unlocked: ['rifle', 'blower', 'sniper', 'cook'],
      bestWave: 7,
      runs: 12,
      firstRun: false,
      settings: {
        bgm: false,
        sfx: true,
        haptic: false,
        dmgNumbers: true,
      },
    }
    await save(custom)
    const reloaded = await load()
    expect(reloaded).toEqual(custom)
  })
})
