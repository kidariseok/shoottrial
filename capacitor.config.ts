import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.kidariseok.defcon2',
  appName: '데프콘 2: 화스트 페이스',
  webDir: 'dist',
  ios: {
    // iOS 1단계 무광고 출시: @capacitor-community/admob을 iOS SPM 패키지 및 네이티브 브릿지에서 완전히 제외한다.
    // 안드로이드는 android.includePlugins 미지정으로 기존 AdMob 포함 플러그인 전체를 유지한다.
    includePlugins: ['@capacitor/app', '@capacitor/haptics', '@capacitor/preferences'],
  },
}

export default config
