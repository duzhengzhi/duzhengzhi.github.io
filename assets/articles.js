const CATS = {
  body: "身体", money: "钱", system: "制度", relation: "关系",
  career: "职业", digital: "数字", essay: "随笔"
};

function columnOf(a) {
  if (a.column) return a.column;
  if (a.slug === "pws-architecture" || a.slug === "yc-property-work-system") return "archive";
  return "life";
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&", "<": "<", ">": ">", '"': """ }[c]));
}

let CURRENT = "all";

function renderChips() {
  const box = document.getElementById("cat-chips");
  if (!box) return;
  const chips = [["all", "全部"]].concat(Object.entries(CATS).filter(([k]) => k !== "essay"));
  box.innerHTML = chips.map(([k, label]) =>
    `<button type="button" class="chip${k === CURRENT ? " on" : ""}" data-cat="${k}">${label}</button>`
  ).join("");
  box.onclick = e => {
    const cat = e.target.getAttribute && e.target.getAttribute("data-cat");
    if (!cat) return;
    CURRENT = cat;
    renderChips();
    renderArticles();
  };
}

async function loadArticles() {
  const res = await fetch("/data/articles.json?t=" + Date.now());
  return res.json();
}

async function renderArticles() {
  const box = document.getElementById("article-list");
  if (!box) return;
  const want = document.body.dataset.column || "life";
  try {
    const items = await loadArticles();
    const list = items.filter(a => {
      if (columnOf(a) !== want) return false;
      return CURRENT === "all" || a.category === CURRENT;
    });
    box.innerHTML = list.map(a => {
      const cat = a.category && CATS[a.category];
      return `
      <a class="post" href="/posts/${esc(a.slug)}.html">
        <div class="post-top">
          ${cat ? `<span class="cat-badge">${cat}</span>` : ""}
          <time datetime="${esc(a.date)}">${esc(a.date)}</time>
          ${a.reading_time ? `<span class="post-rt">${a.reading_time} 分钟</span>` : ""}
          ${a.cost && want === "life" ? `<span class="post-cost">${esc(a.cost)}</span>` : ""}
        </div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.summary || "")}</p>
      </a>`;
    }).join("") || '<p style="padding:16px;color:var(--muted)">这一栏还没有文章。</p>';
  } catch (e) {
    box.innerHTML = '<p style="padding:16px;color:#7d8a82">文章列表加载失败</p>';
  }
}

async function renderHome() {
  const box = document.getElementById("home-essays");
  const life = document.getElementById("home-life");
  if (!box && !life) return;
  try {
    const items = await loadArticles();
    const card = a => `
      <a class="post" href="/posts/${esc(a.slug)}.html">
        <div class="post-top"><time datetime="${esc(a.date)}">${esc(a.date)}</time></div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.summary || "")}</p>
      </a>`;
    if (box) {
      const essays = items.filter(a => columnOf(a) === "essay").slice(0, 3);
      box.innerHTML = essays.map(card).join("") || '<p style="padding:16px;color:var(--muted)">感悟还在写。</p>';
    }
    if (life) {
      const rows = items.filter(a => columnOf(a) === "life").slice(0, 4);
      life.innerHTML = rows.map(card).join("");
    }
  } catch (e) {}
}

renderChips();
renderArticles();
renderHome();
