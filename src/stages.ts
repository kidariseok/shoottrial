// 스테이지 1 웨이브 표(GDD §5.7). 수치의 단일 출처이며 다른 모듈을 import하지 않는다.
// 화학탄 횟수(gas)·강화 군견(dogPlus)은 GDD §5.6

// 종대(convoys) 보병은 infantry에 더해진다(T-121: 웨이브6은 보병9+종대5). 새3종은 기존 보병 일부를 대체한다.
export type WaveDef = { infantry: number; assault: number; shield: number; marksman: number; dog: number; dogPlus: number; rpg: number; boss: number; convoys: number; gas: number; flag: boolean }

// 출현 간격(초), 종대 인원, 종대 안 간격(초)
export const STAGE1 = { spawnGap: 0.8, convoySize: 5, convoyGap: 0.5 }

// 인덱스 = 웨이브 번호 - 1. 깃발은 5·10 웨이브
export const WAVES: readonly WaveDef[] = [
  { infantry: 6, assault: 0, shield: 0, marksman: 0, dog: 0, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 8, assault: 0, shield: 0, marksman: 0, dog: 2, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 8, assault: 0, shield: 0, marksman: 0, dog: 0, dogPlus: 0, rpg: 2, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 7, assault: 3, shield: 0, marksman: 0, dog: 4, dogPlus: 0, rpg: 0, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 10, assault: 3, shield: 0, marksman: 0, dog: 4, dogPlus: 0, rpg: 3, boss: 1, convoys: 0, gas: 0, flag: true },
  { infantry: 9, assault: 4, shield: 3, marksman: 0, dog: 8, dogPlus: 0, rpg: 4, boss: 0, convoys: 1, gas: 0, flag: false },
  { infantry: 8, assault: 5, shield: 3, marksman: 2, dog: 8, dogPlus: 0, rpg: 5, boss: 0, convoys: 0, gas: 1, flag: false },
  { infantry: 8, assault: 6, shield: 4, marksman: 3, dog: 10, dogPlus: 0, rpg: 6, boss: 0, convoys: 0, gas: 0, flag: false },
  { infantry: 7, assault: 7, shield: 5, marksman: 4, dog: 4, dogPlus: 4, rpg: 8, boss: 0, convoys: 2, gas: 1, flag: false },
  { infantry: 7, assault: 8, shield: 6, marksman: 5, dog: 5, dogPlus: 5, rpg: 8, boss: 2, convoys: 0, gas: 2, flag: true },
]
