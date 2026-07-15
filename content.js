(function () {

  let debug = false;
  function log(...args) { if (debug) console.log('[SkipAD]', ...args); }

  const AD_SELECTORS = [
    'ytd-ad-slot-renderer',
    'ytd-banner-promo-renderer',
    'ytd-companion-slot-renderer',
    'ytd-action-companion-ad-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-display-ad-renderer',
    'ytd-statement-banner-renderer',
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    '#masthead-ad',
    '#player-ads',
    '#panels > ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
    '.ytp-ad-overlay-container',
    '.ytp-ad-text-overlay',
    '.ytp-ad-image-overlay',
    'tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)',
    'ytd-popup-container:has(yt-mealbar-promo-renderer)',
    'ytd-merch-shelf-renderer',
    'ytmusic-mealbar-promo-renderer',
    '.ytp-ad-module',
    '.ytp-ad-persistent-progress-bar-container',
    '.ytp-ad-player-overlay-layout',
    '.ytp-ad-action-interstitial',
    'ytd-movie-offer-module-renderer',
    'ytd-promoted-video-renderer'
  ];

  const ADWALL_SELECTORS = [
    'ytd-enforcement-message-view-model',
    '#dialog:has(ytd-enforcement-message-view-model)',
    'ytd-popup-container:has(ytd-enforcement-message-view-model)'
  ];

  const TOAST_SELECTORS = [
    'tp-yt-paper-toast:has(yt-formatted-string)',
    '.yt-notification-action-renderer a[href*="check_ad_blockers"]'
  ];

  const TOAST_TEXTS = [
    'experiencing interruptions',
    'kommt es zu unterbrechungen',
    'el vídeo se interrumpe',
    'la lecture de votre vidéo',
    'o vídeo está a ter interrupções',
    'возникли неполадки',
    'hai riscontrato interruzioni',
    'oplever du afbrydelser',
    'kesinti mi yaşıyorsunuz',
    'bloqueador de anúncios',
    'bloqueador de anuncios',
    'ad blocker',
    'adblocker',
    'anúncios permitem',
    'bloqueur de publicités',
    'werbeblocker'
  ];

  const COOKIE_SELECTORS = [
    'tp-yt-paper-dialog:has(.consent-bump)',
    'ytd-consent-bump-v2-lightbox',
    '#consent-bump',
    '[class*="consent-bump"]'
  ];

  const SKIP_SELECTORS = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-modern',
    'button[id^="skip-button"]',
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-slot',
    'button.ytp-ad-skip-button-modern'
  ];

  const DISMISS_SELECTORS = [
    '#dismiss-button',
    'tp-yt-paper-dialog #dismiss-button',
    'ytd-enforcement-message-view-model #dismiss-button',
    '.ytd-enforcement-message-view-model #dismiss-button',
    'yt-button-renderer#dismiss-button',
    'tp-yt-paper-dialog .dismiss',
    'tp-yt-paper-toast #dismiss-button'
  ];

  let active = true;
  document.documentElement.dataset.skipadActive = '1';
  let handling = false;
  let saved = { rate: 1, muted: false, volume: 1 };
  let ticker = null;
  let observer = null;
  let pollTicker = null;
  let errorCount = 0;
  let styleTag = null;
  let domObserver = null;
  let styleGuard = null;
  let contentGuardRef = null;

  let cssRulesCache = null;

  function buildCssRules() {
    if (cssRulesCache) return cssRulesCache;
    const hide = AD_SELECTORS.concat(ADWALL_SELECTORS, COOKIE_SELECTORS);
    cssRulesCache = hide.join(',\n') + ' { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; pointer-events: none !important; }';
    return cssRulesCache;
  }

  function injectStyles() {
    log('injectStyles called, head:', !!document.head, 'docEl:', !!document.documentElement);
    if (document.getElementById('skipad-hide')) {
      styleTag = document.getElementById('skipad-hide');
      log('skipad-hide already exists');
      return;
    }
    styleTag = document.createElement('style');
    styleTag.id = 'skipad-hide';
    styleTag.textContent = buildCssRules();
    const target = document.head || document.documentElement;
    target.appendChild(styleTag);
    log('skipad-hide injected into', target.tagName);
    protectStyleTag();
  }

  function protectStyleTag() {
    if (styleGuard) styleGuard.disconnect();
    if (contentGuardRef) contentGuardRef.disconnect();
    const target = document.head || document.documentElement;
    styleGuard = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const removed of m.removedNodes) {
          if (removed === styleTag || (removed.id && removed.id === 'skipad-hide')) {
            injectStyles();
            return;
          }
        }
      }
      if (!document.getElementById('skipad-hide')) {
        styleTag = null;
        injectStyles();
      }
    });
    styleGuard.observe(target, { childList: true });

    contentGuardRef = new MutationObserver(() => {
      if (styleTag && styleTag.textContent !== buildCssRules()) {
        styleTag.textContent = buildCssRules();
      }
    });
    if (styleTag) {
      contentGuardRef.observe(styleTag, { childList: true, characterData: true, subtree: true });
    }
  }

  function hideElement(el) {
    if (el.dataset.skipadHidden) return;
    el.dataset.skipadHidden = '1';
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');

    const guard = new MutationObserver(() => {
      if (!el.isConnected) {
        guard.disconnect();
        return;
      }
      if (el.style.getPropertyValue('display') !== 'none') {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
      }
    });
    guard.observe(el, { attributes: true, attributeFilter: ['style'] });
  }

  let scanSelectorCache = null;

  function scanAndHide() {
    if (!scanSelectorCache) {
      scanSelectorCache = AD_SELECTORS.concat(ADWALL_SELECTORS, COOKIE_SELECTORS).join(',');
    }
    try {
      const elements = document.querySelectorAll(scanSelectorCache);
      for (const el of elements) hideElement(el);
    } catch (_) {}
  }

  function isAdWallToast(node) {
    if (!node || !node.textContent) return false;
    const text = node.textContent.toLowerCase();
    return TOAST_TEXTS.some(t => text.includes(t));
  }

  function autoDismiss() {
    for (const sel of DISMISS_SELECTORS) {
      try {
        const btns = document.querySelectorAll(sel);
        for (const btn of btns) {
          btn.click();
        }
      } catch (_) {}
    }
  }

  function handleAdWall(node) {
    if (!node || !node.isConnected) return;
    hideElement(node);
    autoDismiss();

    const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');
    if (overlay && overlay.isConnected) {
      overlay.style.setProperty('display', 'none', 'important');
      overlay.remove();
    }

    try {
      document.querySelectorAll('tp-yt-paper-dialog').forEach(dialog => {
        if (dialog.querySelector('ytd-enforcement-message-view-model') ||
            dialog.querySelector('yt-mealbar-promo-renderer')) {
          hideElement(dialog);
          if (dialog.isConnected) dialog.remove();
        }
      });
    } catch (_) {}

    const v = video();
    if (v && v.paused) v.play().catch(() => {});
  }

  function handleToast(node) {
    if (isAdWallToast(node)) {
      try {
        const toast = node.closest('tp-yt-paper-toast') || node.closest('.yt-notification-action-renderer');
        if (toast) {
          toast.style.setProperty('display', 'none', 'important');
          if (toast.isConnected) toast.remove();
        }
      } catch (_) {}
    }
  }

  function setupDomObserver() {
    if (domObserver) return;
    domObserver = new MutationObserver((mutations) => {
      let needsScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length === 0) continue;
        needsScan = true;
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;

          if (node.tagName === 'YTD-ENFORCEMENT-MESSAGE-VIEW-MODEL' ||
              node.querySelector && node.querySelector('ytd-enforcement-message-view-model')) {
            handleAdWall(node.tagName === 'YTD-ENFORCEMENT-MESSAGE-VIEW-MODEL' ? node :
              node.querySelector('ytd-enforcement-message-view-model'));
          }

          if (node.tagName === 'TP-YT-PAPER-TOAST' || node.tagName === 'YT-FORMATTED-STRING') {
            handleToast(node);
          }

          if (node.querySelector) {
            const toastLinks = node.querySelectorAll('a[href*="check_ad_blockers"]');
            for (const link of toastLinks) {
              const toast = link.closest('tp-yt-paper-toast');
              if (toast) handleToast(toast);
            }
          }
        }
      }
      if (needsScan) scanAndHide();
    });
    domObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });
  }

  function initElementHiding() {
    injectStyles();
    if (document.body) {
      scanAndHide();
      setupDomObserver();
    } else {
      const readyObserver = new MutationObserver(() => {
        if (document.body) {
          readyObserver.disconnect();
          scanAndHide();
          setupDomObserver();
        }
      });
      readyObserver.observe(document.documentElement, { childList: true });
    }
  }

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
      try {
        const btn = document.querySelector(sel);
        if (!btn || btn.offsetParent === null) continue;
        const style = getComputedStyle(btn);
        if (parseFloat(style.opacity) < 0.1) continue;
        if (style.pointerEvents === 'none') continue;
        btn.click();
        return true;
      } catch (_) {}
    }
    return false;
  }

  function forceAdSettings() {
    if (!handling) return;
    try {
      const v = video();
      if (!v) return;
      if (v.playbackRate !== 16) v.playbackRate = 16;
      if (!v.muted) v.muted = true;
      if (v.volume !== 0) v.volume = 0;
    } catch (_) {}
  }

  function tick() {
    try {
      if (!active || !adShowing()) {
        stop();
        return;
      }

      const v = video();
      if (!v) return;

      log('tick: ad detected, rate:', v.playbackRate, 'dur:', v.duration, 'cur:', v.currentTime);
      forceAdSettings();

      if (v.paused) v.play().catch(() => {});

      try {
        document.dispatchEvent(new CustomEvent('skipad-force-skip'));
      } catch (_) {}

      if (!trySkip() && isFinite(v.duration) && v.duration > 0) {
        if (v.currentTime >= v.duration - 0.5) {
          v.currentTime = v.duration;
          v.dispatchEvent(new Event('ended'));
          log('tick: forced ended at', v.duration);
        } else {
          v.currentTime = v.duration;
          log('tick: seeked to', v.duration);
        }
      }

      autoDismiss();

      errorCount = 0;
    } catch (e) {
      errorCount++;
      log('tick error:', e.message);
      if (errorCount >= 5) {
        stop();
        setTimeout(() => { errorCount = 0; onChange(); }, 5000);
      }
    }
  }

  function start() {
    try {
      const v = video();
      if (!v) { log('start: no video element'); return; }

      if (!handling) {
        handling = true;
        log('start: ad handling BEGIN, saving rate:', v.playbackRate, 'muted:', v.muted, 'vol:', v.volume);
        saved.rate = v.playbackRate === 16 ? saved.rate : v.playbackRate;
        saved.muted = v.muted;
        saved.volume = v.volume;
        chrome.storage.local.get({ adCount: 0 }, (d) => {
          chrome.storage.local.set({ adCount: d.adCount + 1 });
        });
        v.addEventListener('ratechange', forceAdSettings);
        v.addEventListener('volumechange', forceAdSettings);
      }

      tick();
      if (!ticker) ticker = setInterval(tick, 150);
    } catch (e) { log('start error:', e.message); }
  }

  function stop() {
    if (ticker) {
      clearInterval(ticker);
      ticker = null;
    }
    if (handling) {
      handling = false;
      log('stop: restoring rate:', saved.rate, 'muted:', saved.muted, 'vol:', saved.volume);
      try {
        const v = video();
        if (v) {
          v.removeEventListener('ratechange', forceAdSettings);
          v.removeEventListener('volumechange', forceAdSettings);
          v.playbackRate = saved.rate;
          v.muted = saved.muted;
          v.volume = saved.volume;
        }
      } catch (_) {}
    }
  }

  function onChange() {
    log('onChange: active:', active, 'adShowing:', adShowing());
    if (!active) {
      stop();
      return;
    }
    if (adShowing()) start();
    else stop();
  }

  function attach() {
    try {
      const p = player();
      if (!p) { log('attach: player not found'); return false; }
      if (observer) observer.disconnect();
      observer = new MutationObserver(onChange);
      observer.observe(p, { attributes: true, attributeFilter: ['class'] });
      log('attach: observer connected to #movie_player');
      onChange();
      return true;
    } catch (e) {
      log('attach error:', e.message);
      return false;
    }
  }

  function waitForPlayer() {
    if (pollTicker) clearInterval(pollTicker);
    pollTicker = setInterval(() => {
      if (attach()) {
        clearInterval(pollTicker);
        pollTicker = null;
      }
    }, 500);
  }

  function setupVideoListener() {
    let lastSrc = '';
    setInterval(() => {
      try {
        const v = video();
        if (!v) return;
        if (v.src !== lastSrc) {
          lastSrc = v.src;
          if (!attach()) waitForPlayer();
        }
        if (adShowing() && !handling) onChange();

        const wall = document.querySelector('ytd-enforcement-message-view-model');
        if (wall) handleAdWall(wall);

      } catch (_) {}
    }, 1000);
  }

  function periodicProtection() {
    setInterval(() => {
      if (!document.getElementById('skipad-hide')) {
        styleTag = null;
        injectStyles();
      }
      scanAndHide();
      autoDismiss();

      const wall = document.querySelector('ytd-enforcement-message-view-model');
      if (wall) handleAdWall(wall);
    }, 3000);
  }

  initElementHiding();

  chrome.storage.local.get({ active: true, debug: false }, (d) => {
    active = d.active;
    document.documentElement.dataset.skipadActive = active ? '1' : '0';
    debug = !!d.debug;
    log('content.js loaded, active:', active);
    if (!attach()) waitForPlayer();
    setupVideoListener();
    periodicProtection();
  });

  document.addEventListener('yt-navigate-finish', () => {
    log('yt-navigate-finish fired');
    scanAndHide();
    if (!attach()) waitForPlayer();
  });

  document.addEventListener('yt-page-data-updated', () => {
    log('yt-page-data-updated fired');
    scanAndHide();
    if (!attach()) waitForPlayer();
  });

  chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'local') {
      if (changes.active) {
        active = changes.active.newValue;
        document.documentElement.dataset.skipadActive = active ? '1' : '0';
        onChange();
      }
      if (changes.debug) {
        debug = !!changes.debug.newValue;
        console.log('[SkipAD] Debug mode:', debug);
      }
    }
  });
})();
