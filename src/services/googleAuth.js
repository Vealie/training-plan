const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient = null;
let _accessToken = null;
let _tokenExpiry = 0;

/** Wait for Google Identity Services script to load */
function waitForGIS(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const start = Date.now();
    const iv = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(iv);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        reject(new Error('Google Identity Services failed to load. Check your internet connection.'));
      }
    }, 150);
  });
}

/**
 * Must be called once with the OAuth client ID before any token requests.
 */
export async function initGoogleAuth(clientId) {
  if (tokenClient) return true; // Already initialised

  await waitForGIS();

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: () => {}, // Replaced per-request
  });

  return true;
}

/**
 * Requests an access token. Opens a consent popup if needed.
 * `prompt` can be '' (silent) or 'consent' (force popup).
 */
export function requestToken(prompt = '') {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google auth not initialised. Call initGoogleAuth first.'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      _accessToken = response.access_token;
      _tokenExpiry = Date.now() + (parseInt(response.expires_in, 10) - 120) * 1000;
      resolve(_accessToken);
    };

    tokenClient.requestAccessToken({ prompt });
  });
}

/** Returns current access token if still valid, otherwise null. */
export function getToken() {
  if (_accessToken && Date.now() < _tokenExpiry) return _accessToken;
  return null;
}

/**
 * Returns a valid token, silently refreshing if expired.
 * Throws if the user needs to re-authenticate interactively.
 */
export async function ensureToken() {
  const existing = getToken();
  if (existing) return existing;

  // Try silent refresh first (no popup)
  try {
    return await requestToken('');
  } catch {
    // Fall through to interactive
  }

  // Interactive sign-in
  return requestToken('consent');
}

/** Revoke the current token and clear state. */
export function signOut() {
  if (_accessToken) {
    window.google?.accounts?.oauth2?.revoke(_accessToken, () => {});
  }
  _accessToken = null;
  _tokenExpiry = 0;
}

export function isAuthenticated() {
  return !!getToken();
}
