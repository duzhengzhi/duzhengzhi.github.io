const CATS = {
  body: "身体", money: "钱", system: "制度", relation: "关系",
  career: "职业", digital: "数字", essay: "随笔"
};
let CURRENT = "all";

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderChips() {
  const box = document.getElementById("cat-chips");
  if (!box) return;
  const chips = [["all", "全部"]].concat(Object.entries(CATS));
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

async function renderArticles() {
  const box = document.getElementById("article-list");
  if (!box) return;
  try {
    const res = await fetch("/data/articles.json?t=" + Date.now());
    const items = await res.json();
    const list = CURRENT === "all" ? items : items.filter(a => a.category === CURRENT);
    box.innerHTML = list.map(a => {
      const cat = a.category && CATS[a.category];
      return `
      <a class="post" href="/posts/${esc(a.slug)}.html">
        <div class="post-top">
          ${cat ? `<span class="cat-badge">${cat}</span>` : ""}
          <time datetime="${esc(a.date)}">${esc(a.date)}</time>
        </div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.summary || "")}</p>
      </a>`;
    }).join("") || '<p style="padding:16px;color:var(--muted)">这个分类还没有文章</p>';
  } catch (e) {
    box.innerHTML = '<p style="padding:16px;color:#7d8a82">文章列表加载失败</p>';
  }
}
renderChips();
renderArticles();
