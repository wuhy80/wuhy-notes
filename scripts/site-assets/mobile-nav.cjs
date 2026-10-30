/**
 * mobile-nav.cjs —— 移动端侧栏抽屉（源码以 .cjs 入库，发布时复制为
 * /static/mobile-nav.js；原因：本机文档加密驱动会加密 .js）
 *
 * 背景：<1200px 时 Quartz 默认把左栏（探索树/分区目录）整块堆在正文上方，
 * 手机上一屏全是目录。样式见 site-custom.scss「14/14 移动端」：左栏改为
 * 固定抽屉，默认 translateX(-104%) 收起。
 *
 * 这里只做三件事（不碰 Quartz 组件）：
 *   · 注入左上角「目录」按钮与遮罩
 *   · 切换 <html class="gz-nav-open">
 *   · 点遮罩 / Esc / 点目录里的链接 / SPA 切页 时关闭抽屉
 */
(function () {
  'use strict';
  var DOC = document.documentElement;

  function isOpen() { return DOC.classList.contains('gz-nav-open'); }

  function setOpen(open) {
    DOC.classList.toggle('gz-nav-open', !!open);
    var btn = document.querySelector('.gz-nav-toggle');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function close() { setOpen(false); }
  function toggle() { setOpen(!isOpen()); }

  function ensure() {
    if (!document.body) return;
    if (document.querySelector('.gz-nav-toggle')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gz-nav-toggle';
    btn.setAttribute('aria-label', '打开目录');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="bars"><i></i><i></i><i></i></span><span>目录</span>';

    var backdrop = document.createElement('div');
    backdrop.className = 'gz-nav-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    document.body.appendChild(btn);
    document.body.appendChild(backdrop);

    btn.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      // 搜索弹层开着时，Esc 交给站点自己关搜索，别把抽屉一起关掉
      var sc = document.querySelector('.search-container');
      var searchOpen = sc && sc.getBoundingClientRect().height > 0 && getComputedStyle(sc).display !== 'none';
      if (searchOpen) return;
      close();
    });

    // 点了目录里的链接就收起抽屉（等链接先跳转）
    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (e.target.closest && e.target.closest('.sidebar.left a')) close();
    }, true);

    // SPA 切页后收起
    document.addEventListener('nav', close);

    // 向下滚动时把按钮收起来（浮在正文上挡字），向上滚/回到顶部再出现
    var lastY = window.scrollY || 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      if (y > 140 && y > lastY + 2) {
        DOC.classList.add('gz-nav-hidden');
      } else if (y < lastY - 2 || y <= 140) {
        DOC.classList.remove('gz-nav-hidden');
      }
      lastY = y;
    }, { passive: true });
  }

  function init() { ensure(); close(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('nav', function () { setTimeout(init, 0); });
})();
