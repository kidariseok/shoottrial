import { defineConfig } from '@apps-in-toss/web-framework/config'

// T-123: 앱인토스 번들(.ait) 설정. `npm run build:toss`가 dist-toss를 빌드한 뒤 이 설정으로 묶는다.
// appName은 앱인토스 콘솔에 등록한 값과 한 글자도 달라서는 안 된다(다르면 업로드 불가, 등록 후 변경 불가). 등록할 때 이 값을 바꾼다.
export default defineConfig({
  appName: 'newbie-defense',
  brand: {
    primaryColor: '#E8C35A', // src/ui/style.css의 --accent-brass
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
  },
  permissions: [],
  webBundleDir: 'dist-toss',
})
