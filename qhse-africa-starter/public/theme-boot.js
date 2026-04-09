(function () {
  try {
    var k = 'qhse.theme';
    var t = localStorage.getItem(k);
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#eef1f7' : '#0f172a');
  } catch (e) {
    /* ignore */
  }
})();
