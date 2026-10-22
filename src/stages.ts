// 스테이지 1 웨이브 표(GDD §5.7). 수치의 단일 출처이며 다른 모듈을 import하지 않는다.
// 화학탄 횟수(gas)·강화 군견(dogPlus)은 GDD §5.6

// 종대(convoys) 보병은 infantry에 더해진다(GDD §5.7: 웨이브 6은 보병 12 + 종대 5)
export type WaveDef = { infantry: number; dog: number; dogPlus: number; rpg: number; boss: number; convoys: number; gas: number; flag: boolean }

// 출현 간격(초), 종대 인원, 종대 안 간격(초)
export const STAGE1 = { spawnGap: 1.2, convoySize: 5, convoyGap: 0.5 }

// 인덱스 = 웨이브 번호 - 1. 깃발은 5·10 웨이브
export const WAVES: readonly WaveDef[] = [
  { infantry: 6, dog: 0, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 8, dog: 2, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 8, dog: 0, dogPlus: 0, rpg: 2, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 10, dog: 4, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 10, dog: 3, dogPlus: 0, rpg: 2, boss: 1, convoys: 0, gas: 0, flag: true },
  { infantry: 12, dog: 6, dogPlus: 0, rpg: 3, boss: 0, convoys: 1, gas: 0, flag: false },
  { infantry: 14, dog: 6, dogPlus: 0, rpg: 4, boss: 0, convoys: 0, gas: 1, flag: false },
  { infantry: 16, dog: 8, dogPlus: 0, rpg: 4, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 18, dog: 4, dogPlus: 4, rpg: 6, boss: 0, convoys: 2, gas: 1, flag: false },
  { infantry: 20, dog: 5, dogPlus: 5, rpg: 6, boss: 2, convoys: 0, gas: 2, flag: true },
]
