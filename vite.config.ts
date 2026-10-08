import { defineConfig } from 'vite';

// base: './' 로 두면 빌드 결과(dist)를 어느 폴더/서버에 올려도 동작한다 (학교 서버, GitHub Pages 등)
export default defineConfig({
  base: './',
  // 한글 경로에서 파일 변경 감지가 누락되는 경우가 있어 polling 사용
  server: { port: 5173, watch: { usePolling: true, interval: 300 } },
  build: { chunkSizeWarningLimit: 2000 }, // Phaser 엔진이 커서 경고 기준을 올림
});
