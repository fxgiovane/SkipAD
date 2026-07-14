(function () {
  const BLOCKED_AD_KEYS = [
    'adPlacements',
    'adSlots',
    'adBreakParams',
    'playerAds',
    'adBreakHeartbeatParams',
    'instreamAdBreakConfig'
  ];

  const AD_URL_PATTERNS = [
    '/pagead/',
    '/ptracking',
    '/api/stats/ads',
    '/api/stats/atr',
    '/get_midroll_info',
    'googlesyndication.com',
    'doubleclick.net',
    'googleadservices.com',
    'adsserver.yt'
  ];

  function stripAdsFromObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of BLOCKED_AD_KEYS) {
      if (key in obj) {
        delete obj[key];
      }
    }
    if (obj.playerResponse) {
      stripAdsFromObject(obj.playerResponse);
    }
    if (obj.playerConfig && obj.playerConfig.adRequestConfig) {
      delete obj.playerConfig.adRequestConfig;
    }
    return obj;
  }

  function isAdUrl(url) {
    if (!url) return false;
    const s = typeof url === 'string' ? url : url.toString();
    return AD_URL_PATTERNS.some(p => s.includes(p));
  }

  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url ? input.url : (input && input.href ? input.href : ''));

    if (isAdUrl(url)) {
      return Promise.resolve(new Response('{}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    return originalFetch.apply(this, arguments).then(response => {
      if (url.includes('/youtubei/v1/player') || url.includes('/youtubei/v1/next') || url.includes('/youtubei/v1/updated_metadata')) {
        const clone = response.clone();
        return clone.json().then(data => {
          stripAdsFromObject(data);
          return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }).catch(() => response);
      }
      return response;
    }).catch(err => {
      throw err;
    });
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._skipad_url = typeof url === 'string' ? url : url.toString();
    this._skipad_blocked = isAdUrl(this._skipad_url);
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    if (this._skipad_blocked) {
      Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
      Object.defineProperty(this, 'status', { value: 200, configurable: true });
      Object.defineProperty(this, 'responseText', { value: '{}', configurable: true });
      Object.defineProperty(this, 'response', { value: '{}', configurable: true });
      const evt = new Event('load');
      this.dispatchEvent(evt);
      if (typeof this.onload === 'function') this.onload(evt);
      const readyEvt = new Event('readystatechange');
      this.dispatchEvent(readyEvt);
      if (typeof this.onreadystatechange === 'function') this.onreadystatechange(readyEvt);
      return;
    }
    return originalSend.apply(this, arguments);
  };

  function patchInitialData() {
    try {
      if (window.ytInitialPlayerResponse) {
        stripAdsFromObject(window.ytInitialPlayerResponse);
      }
      if (window.ytInitialData) {
        stripAdsFromObject(window.ytInitialData);
        if (window.ytInitialData.contents) {
          const tabs = window.ytInitialData.contents.twoColumnBrowseResultsRenderer;
          if (tabs && tabs.tabs) {
            for (const tab of tabs.tabs) {
              if (tab.tabRenderer && tab.tabRenderer.content) {
                const section = tab.tabRenderer.content.sectionListRenderer;
                if (section && section.contents) {
                  section.contents = section.contents.filter(item =>
                    !item.adSlotRenderer &&
                    !item.promotedSparklesTextSearchRenderer &&
                    !item.statementBannerRenderer
                  );
                }
              }
            }
          }
        }
      }
    } catch (_) {}
  }

  const origDefineProperty = Object.defineProperty;
  Object.defineProperty = function (obj, prop, descriptor) {
    if (obj === window && (prop === 'ytInitialPlayerResponse' || prop === 'ytInitialData')) {
      if (descriptor && descriptor.value) {
        stripAdsFromObject(descriptor.value);
      }
      if (descriptor && descriptor.get) {
        const origGet = descriptor.get;
        descriptor.get = function () {
          const val = origGet.call(this);
          return stripAdsFromObject(val);
        };
      }
    }
    return origDefineProperty(obj, prop, descriptor);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchInitialData, { once: true });
  } else {
    patchInitialData();
  }

  let patchAttempts = 0;
  const patchInterval = setInterval(() => {
    patchInitialData();
    patchAttempts++;
    if (patchAttempts >= 10) clearInterval(patchInterval);
  }, 500);

  document.addEventListener('yt-navigate-finish', patchInitialData);
  document.addEventListener('yt-page-data-updated', patchInitialData);

  document.addEventListener('skipad-force-skip', () => {
    try {
      const mp = document.getElementById('movie_player');
      if (mp) {
        if (typeof mp.skipAd === 'function') {
          mp.skipAd();
        } else if (typeof mp.skipVideo === 'function') {
          mp.skipVideo();
        }
      }
    } catch (_) {}
  });
})();
