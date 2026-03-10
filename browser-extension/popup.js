const DEFAULT_SERVER = "https://linkx.best";

// ── Storage helpers ──────────────────────────────────────────────────────────

function getStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function setStorage(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

function removeStorage(keys) {
  return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
}

// ── Screen management ────────────────────────────────────────────────────────

const screens = ["setup", "login", "submit"];

function showScreen(name) {
  screens.forEach(s => {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== name);
  });
}

// ── Page metadata extraction ─────────────────────────────────────────────────

async function getPageMeta() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return { url: "", title: "", description: "" };

    // Inject script into the active tab to read meta tags
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getMeta = (selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
              const val = el.getAttribute("content") || el.getAttribute("value");
              if (val && val.trim()) return val.trim();
            }
          }
          return "";
        };
        return {
          url: location.href,
          title:
            getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
            document.title ||
            "",
          description:
            getMeta([
              'meta[property="og:description"]',
              'meta[name="twitter:description"]',
              'meta[name="description"]',
            ]) || "",
        };
      },
    });

    return results?.[0]?.result || { url: tab.url || "", title: tab.title || "", description: "" };
  } catch {
    // Can't inject into chrome:// or other restricted pages — fall back to tab info
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return { url: tab?.url || "", title: tab?.title || "", description: "" };
    } catch {
      return { url: "", title: "", description: "" };
    }
  }
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function apiLogin(serverUrl, username, password) {
  const res = await fetch(`${serverUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}

async function apiCategories(serverUrl) {
  const res = await fetch(`${serverUrl}/api/categories?withIcons=true`);
  if (!res.ok) return [];
  return res.json(); // [{ name, icon }]
}

async function apiSubmit(serverUrl, token, fields) {
  const res = await fetch(`${serverUrl}/api/links/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fields),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submission failed");
  return data;
}

// ── Setup screen ─────────────────────────────────────────────────────────────

function initSetup() {
  const input = document.getElementById("setup-url");
  const btn = document.getElementById("setup-save");
  const err = document.getElementById("setup-error");

  // Pre-fill with current or default server URL
  getStorage(["serverUrl"]).then(({ serverUrl }) => {
    input.value = serverUrl || DEFAULT_SERVER;
  });

  btn.addEventListener("click", async () => {
    const url = input.value.trim().replace(/\/$/, "");
    if (!url) { showError(err, "Please enter a URL."); return; }
    try { new URL(url); } catch { showError(err, "Invalid URL."); return; }
    await setStorage({ serverUrl: url });
    hideError(err);
    init();
  });

  input.addEventListener("keydown", e => { if (e.key === "Enter") btn.click(); });
}

// ── Login screen ─────────────────────────────────────────────────────────────

function initLogin() {
  const btnSubmit = document.getElementById("login-submit");
  const btnSettings = document.getElementById("login-settings");
  const errEl = document.getElementById("login-error");

  btnSettings.addEventListener("click", () => {
    showScreen("setup");
  });

  btnSubmit.addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    if (!username || !password) { showError(errEl, "Username and password required."); return; }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Logging in…";
    hideError(errEl);

    try {
      const { serverUrl } = await getStorage(["serverUrl"]);
      const { token, user } = await apiLogin(serverUrl, username, password);
      await setStorage({ token, username: user.username });
      init();
    } catch (e) {
      showError(errEl, e.message);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Log In";
    }
  });

  document.getElementById("login-password").addEventListener("keydown", e => {
    if (e.key === "Enter") btnSubmit.click();
  });
}

// ── Submit screen ────────────────────────────────────────────────────────────

async function initSubmit(serverUrl, token, username) {
  document.getElementById("submit-username").textContent = username;

  // Logout
  document.getElementById("submit-logout").addEventListener("click", async () => {
    await removeStorage(["token", "username"]);
    init();
  });

  // Settings (change server)
  document.getElementById("submit-settings").addEventListener("click", async () => {
    await removeStorage(["serverUrl", "token", "username"]);
    init();
  });

  // Auto-fill page meta
  const meta = await getPageMeta();
  document.getElementById("field-url").value = meta.url;
  document.getElementById("field-title").value = meta.title;
  document.getElementById("field-desc").value = meta.description;

  // Load categories
  const catSelect = document.getElementById("field-category");
  try {
    const cats = await apiCategories(serverUrl);
    cats.forEach(({ name, icon }) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = `${icon} ${name}`;
      catSelect.appendChild(opt);
    });
  } catch {
    // categories are optional — proceed without them
  }

  // Submit
  const btnSubmit = document.getElementById("submit-btn");
  const errEl = document.getElementById("submit-error");
  const successEl = document.getElementById("submit-success");

  btnSubmit.addEventListener("click", async () => {
    const url = document.getElementById("field-url").value.trim();
    const title = document.getElementById("field-title").value.trim();
    const description = document.getElementById("field-desc").value.trim();
    const category = catSelect.value;
    const makePublic = document.getElementById("field-public").checked;

    if (!url || !title) { showError(errEl, "URL and title are required."); return; }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Submitting…";
    hideError(errEl);
    successEl.classList.add("hidden");

    try {
      await apiSubmit(serverUrl, token, { url, title, description, category, makePublic });
      successEl.classList.remove("hidden");
      // Reset form except URL
      document.getElementById("field-title").value = "";
      document.getElementById("field-desc").value = "";
      catSelect.value = "";
      document.getElementById("field-public").checked = false;
    } catch (e) {
      showError(errEl, e.message);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Submit Link";
    }
  });
}

// ── Utilities ────────────────────────────────────────────────────────────────

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.classList.add("hidden");
}

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const stored = await getStorage(["serverUrl", "token", "username"]);
  // Fall back to default server — no setup screen needed for regular users
  const serverUrl = stored.serverUrl || DEFAULT_SERVER;
  const { token, username } = stored;

  if (!token) {
    showScreen("login");
    return;
  }

  showScreen("submit");
  initSubmit(serverUrl, token, username || "user");
}

// ── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  initSetup();
  initLogin();
  init();
});
