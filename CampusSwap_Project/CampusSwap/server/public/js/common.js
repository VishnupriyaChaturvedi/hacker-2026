'use strict';

// Shared helpers available to every page.
(function () {
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove('show');
    }, 2000);
  }

  function csrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  async function api(path, options) {
    options = options || {};
    var headers = Object.assign(
      { Accept: 'application/json' },
      options.headers || {}
    );
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.method && options.method !== 'GET') {
      headers['x-csrf-token'] = csrfToken();
    }
    var res = await fetch(path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin'
    });
    var data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    if (!res.ok) {
      var err = new Error((data && data.error) || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function money(value) {
    var n = Number(value) || 0;
    return '\u20b9' + n.toLocaleString('en-IN');
  }

  window.CS = {
    toast: toast,
    api: api,
    csrfToken: csrfToken,
    escapeHtml: escapeHtml,
    money: money
  };

  // Auto-hide flash banners after a few seconds.
  document.addEventListener('DOMContentLoaded', function () {
    var flash = document.getElementById('flash');
    if (flash) {
      setTimeout(function () {
        flash.style.transition = 'opacity .4s';
        flash.style.opacity = '0';
      }, 4000);
    }
  });
})();
