const app = document.getElementById("app");

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&", "<": "<", ">": ">", '"': """ }[c]));
}
function safe(html) {
  return String(html || "").replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

async function load() {
  const res = await fetch("/data/posts.json?t=" + Date.now());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.posts || []).filter(p => p.published !== false);
}

function shell(inner) {
  app.innerHTML = inner;
}

function listView(posts, q) {
  const query = (q || "").trim();
  const rows = posts.filter(p => {
    if (!query) return true;
    return (p.title + p.notebook + (p.tags || []).join(" ") + (p.text || "")).includes(query);
  });
  shell(`
    <section class="hero">
      <h1>文章</h1>
      <p>写在另一边，读在这里。点开就是正文。</p>
    </section>
    <input class="search" id="q" placeholder="搜索" value="${esc(query)}" />
    <div class="list">
      ${rows.map(p => `
        <a class="row" href="#/${esc(p.id)}">
          <span class="vol">${esc(p.notebook || "")}</span>
          <span class="title">${esc(p.title || "无题")}</span>
          <span class="year">${esc(p.date || "")}</span>
        </a>`).join("") || `<p class="empty">还没有文章。</p>`}
    </div>
    <p class="label">下载</p>
    <div class="list">
      <a class="row" href="https://apps.apple.com/cn/app/id6760927492" target="_blank" rel="noopener">
        <span class="vol">iOS</span>
        <span class="title">记得吃药</span>
        <span class="year">App Store</span>
      </a>
      <a class="row" href="https://github.com/duzhengzhi/Ritual" target="_blank" rel="noopener">
        <span class="vol">Mac</span>
        <span class="title">记得吃药 iOS</span>
        <span class="year">下载目录</span>
      </a>
    </div>`);
  const input = document.getElementById("q");
  input.oninput = () => listView(posts, input.value);
}

function articleView(posts, id) {
  const p = posts.find(x => x.id === id);
  if (!p) {
    shell(`<p class="empty">没有这篇文章。</p><a class="back" href="#/">返回</a>`);
    return;
  }
  shell(`
    <p class="kicker">${esc(p.notebook || "")}${p.date ? " · " + esc(p.date) : ""}</p>
    <h1 class="article">${esc(p.title || "无题")}</h1>
    <div class="rule"></div>
    <div class="prose">${safe(p.html || "")}</div>
    <a class="back" href="#/">返回</a>`);
  document.title = (p.title || "文章") + " — 杜铮志";
}

load().then(posts => {
  const draw = () => {
    const id = location.hash.replace(/^#\//, "");
    if (id) articleView(posts, id);
    else {
      document.title = "杜铮志";
      listView(posts, "");
    }
  };
  window.addEventListener("hashchange", draw);
  draw();
}).catch(() => {
  app.innerHTML = `<p class="empty">文章加载失败。</p>`;
});
