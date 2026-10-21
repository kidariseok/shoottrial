export const BASELINE_Y: number
export const ROOT_DIR: string
export const FIXTURES_DIR: string

export interface ParsedContract {
  key: string
  w: number
  h: number
  frames: number
  minFrames: number
  maxFrames: number
  pivot: 'feet' | 'center'
}

export interface PngImage {
  width: number
  height: number
  data: Uint8Array
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface TempWorkspace {
  tempDir: string
  outAssetsDir: string
  ledgerPath: string
  indexPath: string
  writeJson: (path: string, data: unknown) => void
  readJson: (path: string) => any
  writeRawFile: (path: string, buf: unknown) => void
  removeFile: (path: string) => void
  joinPath: (...parts: string[]) => string
}

export function generateFixtures(baseDir?: string): void
export function loadAssetContracts(rootDir?: string): ParsedContract[]
export function removeMagenta(srcPng: PngImage, tolerance?: number): PngImage
export function findBoundingBox(png: PngImage): BoundingBox | null
export function alignFrameToCanvas(cleanedPng: PngImage, contract: ParsedContract, baselineY?: number): PngImage
export function mergeFramesToSheet(alignedFrames: PngImage[], contract: ParsedContract): PngImage
export function processAssetKey(key: string, options?: Record<string, unknown>): any
export function processAllAssets(options?: Record<string, unknown>): any[]
export function checkAssets(options?: Record<string, unknown>): { ok: boolean; checkedCount: number; errors: string[] }
export function readFixturePng(relPath: string): PngImage
export function readPngFile(absPath: string): PngImage
export function getPixel(png: PngImage, x: number, y: number): { r: number; g: number; b: number; a: number }
export function createSolidCustomPng(width: number, height: number, colorType?: number): unknown
export function createTallFeetOverflowPng(): PngImage
export function withTempWorkspace<T>(fn: (ws: TempWorkspace) => T): T
