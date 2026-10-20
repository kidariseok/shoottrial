// docs/TECH.md §8 레인 A·B 경계 고정 시그니처

export type Phase = 'prep' | 'fight' | 'settle'
export type Hud = {
  wave: number
  waves: number
  defcon: 2 | 1
  supply: number
  baseHp: number
  phase: Phase
  prepLeft: number
  speed: 1 | 2
  synergies: { card: string; count: number; on: boolean }[]
}
export type Offer = { card: string; cost: number } | null

export function hud(h: Hud): void {
  // T-102에서 구현
  void h
}

export function shop(
  open: boolean,
  offers: Offer[],
  supply: number,
  onBuy: (i: number) => void,
  onReroll: () => void,
  onGo: () => void
): void {
  // T-102에서 구현
  void open
  void offers
  void supply
  void onBuy
  void onReroll
  void onGo
}

export function cardInfo(card: string | null, rank?: number): void {
  // T-102에서 구현
  void card
  void rank
}

export function banner(text: string, kind: 'flag' | 'defcon' | 'info'): void {
  // T-102에서 구현
  void text
  void kind
}

export function result(
  r: { win: boolean; wave: number; kills: number; unlocked?: string },
  onAgain: () => void,
  onLobby: () => void
): void {
  // T-102에서 구현
  void r
  void onAgain
  void onLobby
}

export function askRevive(onYes: () => void, onNo: () => void): void {
  // T-102에서 구현
  void onYes
  void onNo
}

// 전투 제어: BattleScene이 시작할 때 bindBattle(ctl), 끝날 때 bindBattle(null)을 부른다.
// HUD의 일시정지·2배속 버튼, 일시정지 모달(계속·포기), 전투 중 뒤로가기, 광고 보상 버튼은 B가 그리고 이 함수들을 부른다.
export type BattleCtl = {
  pause(): void
  resume(): void
  setSpeed(s: 1 | 2): void
  quit(): void          // 포기 → A가 결과 화면(result)으로 간다
  adReroll(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 무료 리롤 1회를 적용한다
  adSupply(): void      // 광고를 끝까지 본 뒤 B가 부른다. A가 보급 +5를 적용한다
}

export function bindBattle(ctl: BattleCtl | null): void {
  // T-102에서 구현
  void ctl
}
