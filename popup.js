document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-active');
  const counterEl = document.getElementById('counter');
  const resetBtn = document.getElementById('btn-reset');
  const debugBtn = document.getElementById('btn-debug');
  const versionEl = document.getElementById('ext-version');

  versionEl.textContent = 'v' + chrome.runtime.getManifest().version;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const msg = chrome.i18n.getMessage(key);
    if (msg) {
      el.textContent = msg;
    }
  });

  chrome.storage.local.get({ active: true, adCount: 0, debug: false }, (data) => {
    toggle.checked = data.active;
    counterEl.textContent = data.adCount;
    if (data.debug) debugBtn.classList.add('active');
  });

  toggle.addEventListener('change', () => {
    chrome.storage.local.set({ active: toggle.checked });
  });

  resetBtn.addEventListener('click', () => {
    chrome.storage.local.set({ adCount: 0 });
  });

  debugBtn.addEventListener('click', () => {
    const isActive = debugBtn.classList.toggle('active');
    chrome.storage.local.set({ debug: isActive });
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
