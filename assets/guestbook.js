(function () {
  var dialog = document.getElementById('guestbook-dialog');
  var openBtn = document.getElementById('open-guestbook');
  var closeBtn = document.getElementById('close-guestbook');
  var host = document.getElementById('giscus-host');
  if (!dialog || !openBtn || !closeBtn || !host) return;

  var loaded = false;
  var lastCount = null;
  var armed = false;

  function theme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'noborder_dark'
      : 'noborder_light';
  }

  function loadGiscus() {
    if (loaded) {
      var frame = host.querySelector('iframe.giscus-frame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ setConfig: { theme: theme() } }, 'https://giscus.app');
      }
      return;
    }
    loaded = true;
    host.innerHTML = '';
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.setAttribute('data-repo', 'duzhengzhi/duzhengzhi.github.io');
    s.setAttribute('data-repo-id', 'R_kgDOUP_nUQ');
    s.setAttribute('data-category', 'General');
    s.setAttribute('data-category-id', 'DIC_kwDOUP_nUc4DE_gD');
    s.setAttribute('data-mapping', 'specific');
    s.setAttribute('data-term', '留言');
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '0');
    s.setAttribute('data-emit-metadata', '1');
    s.setAttribute('data-input-position', 'top');
    s.setAttribute('data-theme', theme());
    s.setAttribute('data-lang', 'zh-CN');
    host.appendChild(s);
  }

  function openGb(e) {
    if (e) e.preventDefault();
    loadGiscus();
    lastCount = null;
    armed = false;
    dialog.showModal();
    setTimeout(function () { armed = true; }, 1200);
  }

  function closeGb() {
    if (dialog.open) dialog.close();
  }

  openBtn.addEventListener('click', openGb);
  closeBtn.addEventListener('click', closeGb);
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeGb();
  });
  dialog.addEventListener('cancel', function (e) {
    e.preventDefault();
    closeGb();
  });

  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://giscus.app') return;
    var g = e.data && e.data.giscus;
    if (!g || !g.discussionMetadata) return;
    var n = g.discussionMetadata.totalCommentCount;
    if (typeof n !== 'number') return;
    if (lastCount === null) {
      lastCount = n;
      return;
    }
    if (armed && n > lastCount) {
      lastCount = n;
      setTimeout(closeGb, 450);
      return;
    }
    lastCount = n;
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    var frame = host.querySelector('iframe.giscus-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ setConfig: { theme: theme() } }, 'https://giscus.app');
    }
  });
})();
