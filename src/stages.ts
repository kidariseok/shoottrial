// 스테이지 1 웨이브 표(GDD §5.7). 수치의 단일 출처이며 다른 모듈을 import하지 않는다.

// 종대(convoys) 보병은 infantry에 더해진다(GDD §5.7: 웨이브 6은 보병 12 + 종대 5)
export type WaveDef = { infantry: number; dog: number; rpg: number; boss: number; convoys: number; flag: boolean }

// 출현 간격(초), 종대 인원, 종대 안 간격(초)
export const STAGE1 = { spawnGap: 1.2, convoySize: 5, convoyGap: 0.5 }

// 인덱스 = 웨이브 번호 - 1. 깃발은 5·10 웨이브
export const WAVES: readonly WaveDef[] = [
  { infantry: 6, dog: 0, rpg: 0, boss: 0, convoys: 0, flag: false },
  { infantry: 8, dog: 2, rpg: 0, boss: 0, convoys: 0, flag: false },
  { infantry: 8, dog: 0, rpg: 2, boss: 0, convoys: 0, flag: false },
  { infantry: 10, dog: 4, rpg: 0, boss: 0, convoys: 0, flag: false },
  { infantry: 10, dog: 3, rpg: 2, boss: 1, convoys: 0, flag: true },
  { infantry: 12, dog: 6, rpg: 3, boss: 0, convoys: 1, flag: false },
  { infantry: 14, dog: 6, rpg: 4, boss: 0, convoys: 0, flag: false },
  { infantry: 16, dog: 8, rpg: 4, boss: 0, convoys: 0, flag: false },
  { infantry: 18, dog: 8, rpg: 6, boss: 0, convoys: 2, flag: false },
  { infantry: 20, dog: 10, rpg: 6, boss: 2, convoys: 0, flag: true },
]
