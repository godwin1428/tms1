/* ============================================
   TMS — API Client Layer (Mobile/Capacitor)
   Configured for localhost backend via 10.0.2.2
   (Android emulator routes 10.0.2.2 → host localhost)
   ============================================ */
const API = (() => {
  // Dynamic Host Detection
  // If running on a web server (e.g. laptop on port 8000), use the browser's host
  // If running in Capacitor/Mobile (port is usually empty), use the hardcoded PC IP
  const isMobile = window.location.protocol === 'file:' || window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && window.location.port !== '8000');
  const HOST = isMobile ? '10.239.94.21:8000' : window.location.host;
  
  const BASE_URL = `http://${HOST}/api`;
  const WS_URL   = `ws://${HOST}`;

  let _accessToken  = localStorage.getItem('tms_access_token');
  let _refreshToken = localStorage.getItem('tms_refresh_token');

  function setTokens(access, refresh) {
    _accessToken  = access;
    _refreshToken = refresh;
    if (access)  localStorage.setItem('tms_access_token',  access);
    else         localStorage.removeItem('tms_access_token');
    if (refresh) localStorage.setItem('tms_refresh_token', refresh);
    else         localStorage.removeItem('tms_refresh_token');
  }

  function clearTokens() {
    _accessToken  = null;
    _refreshToken = null;
    localStorage.removeItem('tms_access_token');
    localStorage.removeItem('tms_refresh_token');
    localStorage.removeItem('tms_user');
  }

  function getToken() { return _accessToken; }

  async function _fetch(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
    if (options.body instanceof FormData) delete headers['Content-Type'];

    try {
      let res = await fetch(`${BASE_URL}${url}`, { ...options, headers });

      if (res.status === 401 && _refreshToken) {
        const refreshed = await _refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${_accessToken}`;
          res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
        } else {
          clearTokens();
          if (typeof App !== 'undefined') App.showLogin();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) return res.blob();
      return res.json();
    } catch (e) {
      console.error(`API Error [${url}]:`, e.message);
      throw e;
    }
  }

  async function _refreshAccessToken() {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: _refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      _accessToken = data.access_token;
      localStorage.setItem('tms_access_token', _accessToken);
      return true;
    } catch { return false; }
  }

  function get(url)         { return _fetch(url); }
  function post(url, body)  { return _fetch(url, { method: 'POST', body: JSON.stringify(body) }); }
  function put(url, body)   { return _fetch(url, { method: 'PUT',  body: JSON.stringify(body) }); }
  function del(url)         { return _fetch(url, { method: 'DELETE' }); }
  function upload(url, fd)  { return _fetch(url, { method: 'POST', body: fd }); }

  function connectWebSocket(roomId, onMessage) {
    const ws = new WebSocket(`${WS_URL}/ws/${roomId}`);
    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { onMessage(e.data); }
    };
    ws.onerror  = (e) => console.error('WebSocket error:', e);
    ws.onclose  = ()  => console.log('WebSocket closed');
    return ws;
  }

  return { get, post, put, del, upload, setTokens, clearTokens, getToken, connectWebSocket };
})();
