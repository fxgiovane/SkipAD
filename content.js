(function () {
  const SKIP_SELECTORS = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-modern',
    'button[id^="skip-button"]',
    '.ytp-ad-overlay-close-button'
  ];

  let active = true;
  let handling = false;
  let saved = { rate: 1, muted: false };
  let ticker = null;
  let observer = null;
  let pollTicker = null;

  function player() {
    return document.getElementById('movie_player');
  }

  function video() {
    return document.querySelector('#movie_player video, .html5-video-player video, video');
  }

  function adShowing() {
    const p = player();
    return p && (p.classList.contains('ad-showing') || p.classList.contains('ad-interrupting'));
  }

  function trySkip() {
    for (const sel of SKIP_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function forceAdSettings() {
    if (!handling) return;
    const v = video();
    if (!v) return;
    if (v.playbackRate !== 16) {
      v.playbackRate = 16;
    }
    if (!v.muted) {
      v.muted = true;
    }
  }

  function tick() {
    if (!active || !adShowing()) {
      stop();
      return;
    }

    const v = video();
    if (!v) return;

    forceAdSettings();

    if (v.paused) {
      v.play().catch(() => {});
    }

    if (!trySkip() && isFinite(v.duration) && v.duration > 0) {
      v.currentTime = v.duration - 0.1;
    }
  }

  function start() {
    const v = video();
    if (!v) return;

    if (!handling) {
      handling = true;
      saved.rate = v.playbackRate === 16 ? saved.rate : v.playbackRate;
      saved.muted = v.muted;
      chrome.storage.local.get({ adCount: 0 }, (d) => {
        chrome.storage.local.set({ adCount: d.adCount + 1 });
      });
      v.addEventListener('ratechange', forceAdSettings);
      v.addEventListener('volumechange', forceAdSettings);
    }

    tick();
    if (!ticker) {
      ticker = setInterval(tick, 250);
    }
  }

  function stop() {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
    if (handling) {
      handling = false;
      const v = video();
      if (v) {
        v.removeEventListener('ratechange', forceAdSettings);
        v.removeEventListener('volumechange', forceAdSettings);
        v.playbackRate = saved.rate;
        v.muted = saved.muted;
      }
    }
  }

  function onChange() {
    if (!active) {
      stop();
      return;
    }
    if (adShowing()) start();
    else stop();
  }

  function attach() {
    const p = player();
    if (!p) return false;
    if (observer) observer.disconnect();
    observer = new MutationObserver(onChange);
    observer.observe(p, { attributes: true, attributeFilter: ['class'] });
    onChange();
    return true;
  }

  function waitForPlayer() {
    if (pollTicker) {
      clearInterval(pollTicker);
    }
    let attempts = 0;
    pollTicker = setInterval(() => {
      if (attach() || ++attempts > 40) {
        clearInterval(pollTicker);
        pollTicker = null;
      }
    }, 250);
  }

  chrome.storage.local.get({ active: true }, (d) => {
    active = d.active;
    if (!attach()) waitForPlayer();
  });

  document.addEventListener('yt-navigate-finish', () => {
    if (!attach()) waitForPlayer();
  });

  chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local' && changes.active) {
      active = changes.active.newValue;
      onChange();
    }
  });
})();
