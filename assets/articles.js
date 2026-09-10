async function renderArticles() {
  const box = document.getElementById("article-list");
  if (!box) return;
  try {
    const res = await fetch("/data/articles.json?t=" + Date.now());
    const items = await res.json();
    box.innerHTML = items.map(a => `
      <a class="post" href="/posts/${a.slug}.html">
        <time datetime="${a.date}">${a.date}</time>
        <h3>${a.title}</h3>
        <p>${a.summary || ""}</p>
      </a>`).join("");
  } catch (e) {
    box.innerHTML = '<p style="padding:16px;color:#86868b">文章列表加载失败</p>';
  }
}
renderArticles();
