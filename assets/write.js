const DB = "du-notes";
const STORE = "notes";
const REPO = "duzhengzhi/duzhengzhi.github.io";

const booksEl = document.getElementById("books");
const notesEl = document.getElementById("notes");
const editorEl = document.getElementById("editor");
const titleEl = document.getElementById("title");
const sheetEl = document.getElementById("sheet");
const tagsEl = document.getElementById("tags");
const statusEl = document.getElementById("status");
const findEl = document.getElementById("find");

let notes = [];
let book = "全部";
let current = null;
let timer = null;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(note) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(note);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function plain(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return d.textContent || "";
}

async function seed() {
  const existing = await dbAll();
  if (existing.length) return existing;
  try {
    const res = await fetch("/data/posts.json?t=" + Date.now());
    const data = await res.json();
    const seeded = (data.posts || []).map(p => ({
      id: p.id,
      title: p.title,
      notebook: p.notebook || "随笔",
      tags: p.tags || [],
      html: p.html || "",
      pinned: false,
      deleted: false,
      published: true,
      date: p.date || today(),
      updated: Date.now()
    }));
    for (const n of seeded) await dbPut(n);
    return seeded;
  } catch (e) {
    return [];
  }
}

function visible() {
  const q = findEl.value.trim();
  return notes
    .filter(n => book === "废纸篓" ? n.deleted : !n.deleted)
    .filter(n => book === "全部" || book === "废纸篓" || n.notebook === book)
    .filter(n => !q || (n.title + plain(n.html) + (n.tags || []).join(" ")).includes(q))
    .sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));
}

function renderBooks() {
  const names = ["全部", ...new Set(notes.filter(n => !n.deleted).map(n => n.notebook || "随笔")), "废纸篓"];
  booksEl.innerHTML = `<div class="side-label">笔记本</div>` + names.map(name =>
    `<button class="nb${name === book ? " on" : ""}" data-book="${name}" type="button">${name}</button>`
  ).join("") + `<button class="add" id="new-book" type="button">新笔记本</button>`;
  booksEl.querySelectorAll("[data-book]").forEach(btn => {
    btn.onclick = () => { book = btn.dataset.book; current = null; render(); };
  });
  document.getElementById("new-book").onclick = async () => {
    const name = prompt("笔记本名称");
    if (!name) return;
    book = name.trim();
    await createNote();
  };
}

function renderNotes() {
  const rows = visible();
  notesEl.innerHTML = rows.map(n => `
    <button class="note-item${current && current.id === n.id ? " on" : ""}" data-id="${n.id}" type="button">
      ${n.pinned ? "置顶 · " : ""}${n.title || "无题"}
      <small>${n.notebook || "随笔"}${n.published ? " · 已发布" : ""}</small>
    </button>`).join("") || `<p class="status">这一栏是空的。</p>`;
  notesEl.querySelectorAll("[data-id]").forEach(btn => {
    btn.onclick = () => openNote(btn.dataset.id);
  });
}

function renderEditor() {
  if (!current) {
    editorEl.hidden = true;
    return;
  }
  editorEl.hidden = false;
  if (document.activeElement !== titleEl) titleEl.value = current.title || "";
  if (document.activeElement !== sheetEl) sheetEl.innerHTML = current.html || "";
  if (document.activeElement !== tagsEl) tagsEl.value = (current.tags || []).join(" ");
}

function render() {
  renderBooks();
  renderNotes();
  renderEditor();
}

function touch() {
  if (!current) return;
  current.title = titleEl.value.trim();
  current.html = sheetEl.innerHTML;
  current.tags = tagsEl.value.split(/\s+/).filter(Boolean);
  current.updated = Date.now();
  current.date = current.date || today();
  statusEl.textContent = "保存中";
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await dbPut(current);
    const i = notes.findIndex(n => n.id === current.id);
    if (i >= 0) notes[i] = current;
    statusEl.textContent = "已保存";
    renderNotes();
  }, 280);
}

async function createNote() {
  const note = {
    id: uid(),
    title: "",
    notebook: book === "全部" || book === "废纸篓" ? "随笔" : book,
    tags: [],
    html: "",
    pinned: false,
    deleted: false,
    published: false,
    date: today(),
    updated: Date.now()
  };
  notes.unshift(note);
  await dbPut(note);
  openNote(note.id);
  titleEl.focus();
}

function openNote(id) {
  current = notes.find(n => n.id === id) || null;
  render();
  if (current) sheetEl.innerHTML = current.html || "";
}

function apply(cmd) {
  if (!current) return;
  sheetEl.focus();
  if (cmd === "h2") document.execCommand("formatBlock", false, "h2");
  if (cmd === "bold") document.execCommand("bold");
  if (cmd === "italic") document.execCommand("italic");
  if (cmd === "quote") document.execCommand("formatBlock", false, "blockquote");
  if (cmd === "list") document.execCommand("insertUnorderedList");
  if (cmd === "line") document.execCommand("insertHTML", false, "<hr>");
  if (cmd === "pin") current.pinned = !current.pinned;
  if (cmd === "trash") {
    current.deleted = !current.deleted;
    if (current.deleted) current.published = false;
  }
  touch();
  render();
}

function b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function publish() {
  const token = localStorage.getItem("gh-token");
  if (!token) {
    document.getElementById("token-modal").hidden = false;
    return;
  }
  statusEl.textContent = "发布中";
  const posts = notes.filter(n => n.published && !n.deleted).map(n => ({
    id: n.id,
    title: n.title || "无题",
    notebook: n.notebook || "随笔",
    tags: n.tags || [],
    date: n.date || today(),
    html: n.html || "",
    text: plain(n.html)
  }));
  const body = JSON.stringify({ posts }, null, 2);
  const headers = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json" };
  let sha = "";
  const cur = await fetch(`https://api.github.com/repos/${REPO}/contents/data/posts.json`, { headers });
  if (cur.ok) sha = (await cur.json()).sha;
  const put = await fetch(`https://api.github.com/repos/${REPO}/contents/data/posts.json`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "发布文章",
      content: b64(body + "\n"),
      sha: sha || undefined,
      branch: "main"
    })
  });
  if (!put.ok) {
    statusEl.textContent = "发布失败";
    const err = await put.json().catch(() => ({}));
    alert(err.message || "发布失败。检查令牌是否有仓库写入权限。");
    return;
  }
  statusEl.textContent = "已发布";
}

document.getElementById("tools").onclick = e => {
  const cmd = e.target.dataset && e.target.dataset.cmd;
  if (cmd) apply(cmd);
};
titleEl.oninput = touch;
sheetEl.oninput = touch;
tagsEl.oninput = touch;
findEl.oninput = () => renderNotes();
document.getElementById("create").onclick = createNote;
document.getElementById("publish").onclick = e => {
  e.preventDefault();
  if (current && !current.deleted) {
    current.published = true;
    const i = notes.findIndex(n => n.id === current.id);
    if (i >= 0) notes[i] = current;
    touch();
  }
  publish();
};
document.getElementById("token-cancel").onclick = () => {
  document.getElementById("token-modal").hidden = true;
};
document.getElementById("token-form").onsubmit = e => {
  e.preventDefault();
  const token = document.getElementById("token").value.trim();
  if (token) localStorage.setItem("gh-token", token);
  document.getElementById("token-modal").hidden = true;
  publish();
};
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
    e.preventDefault();
    createNote();
  }
});

seed().then(list => {
  notes = list;
  render();
  const first = visible()[0];
  if (first) openNote(first.id);
});
