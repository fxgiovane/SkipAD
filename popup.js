document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-active');
  const counterEl = document.getElementById('counter');
  const resetBtn = document.getElementById('btn-reset');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) {
      el.textContent = msg;
    }
  });

  chrome.storage.local.get({ active: true, adCount: 0 }, (data) => {
    toggle.checked = data.active;
    counterEl.textContent = data.adCount;
  });

  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ active: toggle.checked });
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set({ adCount: 0 });
  });

  const animations = [
    'anim-bounce', 'anim-spin3d', 'anim-pulse', 'anim-shake', 'anim-flip',
    'anim-zoomin', 'anim-slidedown', 'anim-rubberband', 'anim-flash', 'anim-swing'
  ];
  const randomAnim = animations[Math.floor(Math.random() * animations.length)];
  counterEl.classList.add(randomAnim);

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.adCount) {
        counterEl.textContent = changes.adCount.newValue;
      }
      if (changes.active) {
        toggle.checked = changes.active.newValue;
      }
    }
  });
});
