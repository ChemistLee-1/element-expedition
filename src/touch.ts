import { unlockAudio } from './systems/audio';

// 모바일 화면 컨트롤러.
// 버튼을 누르면 키보드와 똑같은 keydown/keyup 이벤트를 보내서, 게임 코드는 키보드만 알면 된다.
// (keyCode 까지 넣어 주어야 Phaser 가 "꾹 누르고 있음"을 인식해 계속 걸어간다)

const KEY_CODES: Record<string, number> = {
  ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyX: 88, Enter: 13,
};

function send(type: 'keydown' | 'keyup', code: string) {
  const ev = new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true });
  const kc = KEY_CODES[code];
  Object.defineProperty(ev, 'keyCode', { get: () => kc });
  Object.defineProperty(ev, 'which', { get: () => kc });
  window.dispatchEvent(ev);
}

/**
 * 모바일 전용 화면: 기기를 판별하지 않고 항상 화면 컨트롤러를 보여 준다.
 * (메신저 앱 안 브라우저 등에서 기기 판별이 틀리는 문제를 없애기 위해)
 * 컴퓨터에서도 같은 화면이 나오며, 키보드 조작도 그대로 된다.
 */
export function setupTouchControls() {
  document.body.classList.add('touch');

  const pad = document.getElementById('pad');
  if (!pad) return;

  // 길게 누를 때 메뉴(복사·저장)가 뜨지 않게
  pad.addEventListener('contextmenu', e => e.preventDefault());

  for (const btn of pad.querySelectorAll<HTMLButtonElement>('button[data-key]')) {
    const code = btn.dataset.key!;
    let held = false;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      unlockAudio();
      if (held) return;
      held = true;
      btn.classList.add('on');
      try { btn.setPointerCapture(e.pointerId); } catch { /* 일부 브라우저는 지원 안 함 */ }
      navigator.vibrate?.(8);
      send('keydown', code);
    };
    const up = (e: PointerEvent) => {
      e.preventDefault();
      if (!held) return;
      held = false;
      btn.classList.remove('on');
      send('keyup', code);
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
  }

  // 전체 화면 (안드로이드 등 지원하는 브라우저에서만 보임)
  const fs = pad.querySelector<HTMLButtonElement>('[data-action="fullscreen"]');
  if (fs) {
    const el = document.documentElement;
    if (!el.requestFullscreen) fs.style.display = 'none';
    fs.addEventListener('click', () => {
      unlockAudio();
      if (document.fullscreenElement) void document.exitFullscreen();
      else void el.requestFullscreen().catch(() => undefined);
    });
  }

  // 화면을 아무 데나 처음 터치해도 소리가 켜지도록
  window.addEventListener('pointerdown', unlockAudio, { once: true });
}
