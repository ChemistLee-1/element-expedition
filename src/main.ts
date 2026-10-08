import Phaser from 'phaser';
import './fonts.css';
import { setupTouchControls } from './touch';
import { W, H } from './ui/ui';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { IntroScene } from './scenes/IntroScene';
import { OverworldScene } from './scenes/OverworldScene';
import { QuizScene } from './scenes/QuizScene';
import { DexScene } from './scenes/DexScene';
import * as state from './systems/state';
import * as quiz from './systems/quiz';
import { SummaryScene } from './scenes/SummaryScene';

async function start() {
  setupTouchControls();
  // 도트 폰트가 준비된 뒤에 게임을 시작해야 글자가 깨지지 않는다
  await Promise.all([
    document.fonts.load('12px Galmuri11'),
    document.fonts.load('bold 12px Galmuri11'),
    document.fonts.load('10px Galmuri9'),
    document.fonts.load('8px Galmuri7'),
  ]).catch(() => undefined);

  // ?debug : 개발용 (창이 가려져도 setTimeout 으로 게임 루프를 돌리고, window.__game 노출)
  const debug = new URLSearchParams(location.search).has('debug');

  const game = new Phaser.Game({
    fps: debug ? { forceSetTimeOut: true, target: 60 } : undefined,
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#101018',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // 뒤에 있을수록 화면 위에 그려진다
    scene: [BootScene, TitleScene, IntroScene, OverworldScene, QuizScene, SummaryScene, DexScene],
  });
  if (debug) Object.assign(window, { __game: game, __dbg: { state, quiz } });
}

void start();
