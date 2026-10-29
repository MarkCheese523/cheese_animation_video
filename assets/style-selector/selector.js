const STORAGE_KEY = 'html-animation-video-style';
const STYLE_NAMES = {
  'cream-neon': '奶油波普',
  'dark-narrative': '深色插画叙事'
};
const SAMPLE_URLS = {
  'cream-neon': '/samples/cream-neon/player.html?scene=all',
  'dark-narrative': '/samples/dark-narrative/player.html?scene=all'
};

const status = document.querySelector('#selectionStatus');
const cards = [...document.querySelectorAll('[data-style]')];
let selectedStyle = null;

function readSelection() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return Object.hasOwn(STYLE_NAMES, saved) ? saved : null;
  } catch {
    return null;
  }
}

function renderSelection() {
  for (const card of cards) {
    const isSelected = card.dataset.style === selectedStyle;
    card.classList.toggle('is-selected', isSelected);
    const chooseButton = card.querySelector('[data-choose]');
    chooseButton.querySelector('.choose-label').textContent = isSelected ? '已选用此风格' : '选用此风格';
    chooseButton.setAttribute('aria-pressed', String(isSelected));
  }
  status.hidden = !selectedStyle;
  if (selectedStyle) {
    status.textContent = `已选择「${STYLE_NAMES[selectedStyle]}」，本次选择已保存在此浏览器。`;
  }
}

function stopPreview(styleId) {
  const card = document.querySelector(`[data-style="${styleId}"]`);
  const stage = card.querySelector('.sample-stage');
  stage.querySelector('iframe')?.remove();
  stage.classList.remove('is-playing');
  for (const button of card.querySelectorAll('[data-play]')) {
    button.setAttribute('aria-expanded', 'false');
  }
  card.querySelector('.text-button .play-label').textContent = '播放样例';
}

function startPreview(styleId) {
  const card = document.querySelector(`[data-style="${styleId}"]`);
  const stage = card.querySelector('.sample-stage');
  if (stage.classList.contains('is-playing')) {
    stopPreview(styleId);
    return;
  }

  for (const otherId of Object.keys(SAMPLE_URLS)) {
    if (otherId !== styleId) stopPreview(otherId);
  }

  const frame = document.createElement('iframe');
  frame.className = 'sample-frame';
  frame.title = `${STYLE_NAMES[styleId]} 30 秒完整样例`;
  frame.allow = 'autoplay; fullscreen';
  frame.setAttribute('allowfullscreen', '');
  frame.dataset.src = SAMPLE_URLS[styleId];
  frame.addEventListener('load', () => {
    const deadline = performance.now() + 8000;
    const autoPlay = () => {
      if (!frame.isConnected || performance.now() > deadline) return;
      if (typeof frame.contentWindow?.__seek !== 'function') {
        setTimeout(autoPlay, 50);
        return;
      }
      const playerButton = frame.contentDocument?.querySelector('#playButton');
      if (playerButton?.textContent === '播放') playerButton.click();
    };
    autoPlay();
  }, { once: true });
  frame.src = frame.dataset.src;
  stage.append(frame);
  stage.classList.add('is-playing');
  for (const button of card.querySelectorAll('[data-play]')) {
    button.setAttribute('aria-expanded', 'true');
  }
  card.querySelector('.text-button .play-label').textContent = '关闭预览';
  stage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

for (const button of document.querySelectorAll('[data-play]')) {
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => startPreview(button.dataset.play));
}

for (const button of document.querySelectorAll('[data-choose]')) {
  button.addEventListener('click', () => {
    selectedStyle = button.dataset.choose;
    let saved = true;
    try {
      localStorage.setItem(STORAGE_KEY, selectedStyle);
    } catch {
      saved = false;
    }
    renderSelection();
    if (!saved) {
      status.textContent = `已选择「${STYLE_NAMES[selectedStyle]}」，但浏览器未允许保存选择。`;
    }
  });
}

selectedStyle = readSelection();
renderSelection();
