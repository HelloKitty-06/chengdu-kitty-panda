/* ============================================================
   成都熊猫旅行局 · 交互脚本（零依赖 / 性能优先）
   结构：00 工具 / 01 Toast / 02 心形迸发 / 03 收藏心愿单
         04 Loading / 05 背景装饰 / 06 竹叶飘落 / 07 跑马灯
         08 导航 / 09 滚动显现 / 10 滚动总线 / 11 景点地图
         12 美食翻牌 / 13 路线动画 / 14 打卡任务 / 15 留言板
         16 回到顶部 / 17 吉祥物彩蛋 / 18 初始化
============================================================ */
'use strict';

/* ---------- 00 工具函数 ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
var MOTION_OK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function storeGet(key) { try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function storeSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 隐身模式下静默降级 */ } }
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 01 全局轻提示 ---------- */
var toastEl = null, toastIco = null, toastText = null, toastTimer = null;
function toast(ico, text) {
  if (!toastEl) return;
  toastIco.textContent = ico;
  toastText.textContent = text;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2600);
}

/* ---------- 02 心形迸发粒子（transform/opacity，自动清理） ---------- */
function burstHearts(cx, cy, n) {
  if (!MOTION_OK) return;
  n = n || 6;
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.className = 'burst-heart';
    var ang = rand(0, Math.PI * 2);
    var dist = rand(38, 88);
    s.style.left = cx + 'px';
    s.style.top = cy + 'px';
    s.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(0) + 'px');
    s.style.setProperty('--ty', (Math.sin(ang) * dist - 42).toFixed(0) + 'px');
    s.style.setProperty('--r', rand(-40, 40).toFixed(0) + 'deg');
    s.innerHTML = '<svg viewBox="0 0 32 30" aria-hidden="true"><use href="#kx-heart"/></svg>';
    document.body.appendChild(s);
    (function (el) { setTimeout(function () { el.remove(); }, 900); })(s);
  }
}

/* ---------- 03 收藏心愿单（导航计数 + 全站红心按钮同步） ---------- */
var FAV_KEY = 'kx-favs';
function favGet() { var v = storeGet(FAV_KEY); return (v && v.length) ? v : []; }
function favHas(k) { return favGet().indexOf(k) !== -1; }
function toggleFav(key, name, cx, cy) {
  var list = favGet();
  var i = list.indexOf(key);
  if (i === -1) {
    list.push(key);
    toast('\uD83D\uDC97', '「' + name + '」已加入心愿单');
    if (cx != null) burstHearts(cx, cy, 6);
  } else {
    list.splice(i, 1);
    toast('\u2661', '「' + name + '」移出了心愿单');
  }
  storeSet(FAV_KEY, list);
  syncFavUI();
}
function syncFavUI() {
  var c = $('#favCount');
  if (c) c.textContent = favGet().length;
  $$('.heart-btn').forEach(function (b) {
    var on = favHas(b.getAttribute('data-key'));
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function initHearts() {
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.heart-btn');
    if (!b) return;
    e.preventDefault();
    var r = b.getBoundingClientRect();
    toggleFav(b.getAttribute('data-key'), b.getAttribute('data-name') || '这颗爱心', r.left + r.width / 2, r.top + r.height / 2);
  });
}

/* ---------- 04 Loading 加载屏（竹节进度 + 轮播文案） ---------- */
function initLoading() {
  var loader = $('#loader'), fill = $('#loaderFill'), text = $('#loaderText');
  if (!loader) return;
  var texts = ['正在铺开成都手账…', '竹叶点心摆盘中…', '马卡龙颜料搅拌均匀…', '熊猫局长盖章认证中…', '马上就好，请稍等…'];
  var p = 0, ti = 0, t0 = Date.now();
  var tick = setInterval(function () {
    p = Math.min(96, p + rand(3, 9));
    fill.style.width = p + '%';
    var nt = Math.min(texts.length - 1, Math.floor(p / 22));
    if (nt !== ti) { ti = nt; text.textContent = texts[ti]; }
    if (Date.now() - t0 > 1500 && p >= 90) { p = 100; }
    if (p >= 100) { clearInterval(tick); finish(); }
  }, 110);
  function finish() {
    fill.style.width = '100%';
    text.textContent = '盖好章啦，出发！';
    setTimeout(function () {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      setTimeout(function () { loader.style.display = 'none'; }, 700);
    }, 350);
  }
}

/* ---------- 05 背景装饰层（云朵 / 星星 / 蝴蝶结 / 爪印 / 竹叶） ---------- */
function initBgDeco() {
  var layer = $('#bgDeco');
  if (!layer) return;
  var frag = document.createDocumentFragment();
  var defs = [
    { cls: 'bg-cloud', n: 3, img: 'images/cloud.svg', s: [110, 170], op: .9, drift: true },
    { cls: 'bg-star', n: 6, tag: 'kx-star', vb: '0 0 24 24', s: [10, 20], op: .8 },
    { cls: 'bg-bow', n: 3, tag: 'kx-bow', vb: '0 0 60 40', s: [24, 36], op: .7 },
    { cls: 'bg-paw', n: 3, tag: 'kx-paw', vb: '0 0 60 60', s: [20, 30], op: .5 },
    { cls: 'bg-leaf', n: 2, img: 'images/leaf.svg', s: [24, 34], op: .8 }
  ];
  defs.forEach(function (d) {
    for (var i = 0; i < d.n; i++) {
      var el = document.createElement('span');
      el.className = 'bg-item ' + d.cls;
      el.style.width = rand(d.s[0], d.s[1]).toFixed(0) + 'px';
      el.style.left = rand(2, 92).toFixed(1) + 'vw';
      el.style.top = rand(4, 88).toFixed(1) + 'vh';
      el.style.opacity = d.op;
      if (d.drift) {
        el.style.animationDuration = rand(90, 150).toFixed(0) + 's';
        el.style.animationDelay = (-rand(0, 120)).toFixed(0) + 's';
      } else if (d.cls === 'bg-star') {
        el.style.animationDelay = rand(0, 3).toFixed(1) + 's';
      }
      el.innerHTML = d.img ? '<img src="' + d.img + '" alt="" aria-hidden="true">' : '<svg viewBox="' + d.vb + '" aria-hidden="true"><use href="#' + d.tag + '"/></svg>';
      frag.appendChild(el);
    }
  });
  layer.appendChild(frag);
}

/* ---------- 06 竹叶飘落层 ---------- */
function initLeaves() {
  var layer = $('#leafLayer');
  if (!layer || !MOTION_OK) return;
  var frag = document.createDocumentFragment();
  for (var i = 0; i < 13; i++) {
    var el = document.createElement('span');
    el.className = 'leaf';
    el.style.setProperty('--x', rand(0, 96).toFixed(1) + 'vw');
    el.style.setProperty('--t', rand(9, 17).toFixed(1) + 's');
    el.style.setProperty('--delay', (-rand(0, 16)).toFixed(1) + 's');
    el.style.setProperty('--s', rand(.75, 1.5).toFixed(2));
    el.style.setProperty('--sway', rand(-9, 9).toFixed(1) + 'vw');
    el.innerHTML = '<img class="leaf-img" src="images/leaf.svg" alt="" aria-hidden="true">';
    frag.appendChild(el);
  }
  layer.appendChild(frag);
}

/* ---------- 07 贴纸跑马灯 ---------- */
function initTicker() {
  var track = $('#tickerTrack');
  if (!track) return;
  var items = [
    '熊猫局长 24h 在线营业', '今天也要去成都吃火锅鸭！', '盖碗茶 + 采耳 = 神仙下午',
    '宽窄巷子 · 锦里 · 春熙路', '小酒馆门口等一句《成都》', '竹叶味の hello 给你'
  ];
  var half = '';
  items.forEach(function (t) {
    half += '<span class="tick-item">' + t + '</span><svg class="tick-paw" viewBox="0 0 60 60" aria-hidden="true"><use href="#kx-paw"/></svg>';
  });
  track.innerHTML = half + half;
}
/* ---------- 08 顶部导航：滚动高亮 + 移动端汉堡 ---------- */
var NAV_SECTIONS = [];
function initNav() {
  var header = $('#navBar'), toggle = $('#navToggle');
  if (!header) return;
  $$('.nav-link').forEach(function (a) {
    var sec = document.getElementById(a.getAttribute('href').slice(1));
    if (sec) NAV_SECTIONS.push({ id: sec.id, link: a, el: sec });
  });
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
    $$('.nav-link').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) {
        header.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}
function updateNavSpy() {
  var probe = window.scrollY + window.innerHeight * 0.32;
  var cur = NAV_SECTIONS[0];
  NAV_SECTIONS.forEach(function (s) { if (s.el.offsetTop <= probe) cur = s; });
  NAV_SECTIONS.forEach(function (s) { s.link.classList.toggle('is-active', s === cur); });
}

/* ---------- 09 滚动显现 ---------- */
function initReveal() {
  var els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-visible'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (e) { io.observe(e); });
}

/* ---------- 10 滚动总线（rAF 合帧，多处逻辑共享一次计算） ---------- */
var scrollFns = [], scrollDirty = true, rafOn = false;
function onScrollBus(fn) { scrollFns.push(fn); markScroll(); }
function markScroll() {
  scrollDirty = true;
  if (!rafOn) { rafOn = true; requestAnimationFrame(runBus); }
}
function runBus() {
  if (scrollDirty) { scrollDirty = false; scrollFns.forEach(function (f) { f(); }); }
  rafOn = false;
}
function initScrollBus() {
  window.addEventListener('scroll', markScroll, { passive: true });
  window.addEventListener('resize', markScroll);
}

/* ---------- 11 手绘景点地图 ---------- */
var CATS = {
  kids:    { name: '熊猫团子', color: '#ff7fa8', emoji: '\uD83D\uDC3C' },
  nature:  { name: '山水氧吧', color: '#5cb98b', emoji: '\u26F0' },
  oldtown: { name: '老街烟火', color: '#f2a04e', emoji: '\uD83C\uDFEE' },
  culture: { name: '人文诗书', color: '#9d7bd8', emoji: '\uD83D\uDCDC' }
};
var SPOTS = [
  { id: 'panda',    name: '大熊猫基地',   en: 'PANDA BASE',      emoji: '\uD83D\uDC3C', cat: 'kids',    x: 87, y: 15,
    desc: '上百只滚滚的官方职场：幼崽班抱着竹子干饭，老年班挂在树上睡午觉。',
    time: '08:00-18:00', ticket: '\u00A555 \u00B7 提前订', hot: 5,
    tip: '直奔月亮产房与幼年园，上午 8-10 点滚滚最活泼，迟到了只能看毛绒玩具。' },
  { id: 'dam',      name: '都江堰',       en: 'DUJIANGYAN',      emoji: '\uD83C\uDF0A', cat: 'nature',  x: 14, y: 26,
    desc: '两千多岁的水利工程，鱼嘴分水、宝瓶引流，李冰父子的超神设计。',
    time: '08:30-18:00', ticket: '\u00A580 \u00B7 含电瓶车', hot: 4,
    tip: '从离堆公园进，沿江边栈道走到安澜索桥，江风一吹，暑气全消。' },
  { id: 'qing',     name: '青城山',       en: 'MT.QINGCHENG',    emoji: '\u26F0',       cat: 'nature',  x: 24, y: 40,
    desc: '青城天下幽，前山访道观，后山听溪水，负氧离子管够。',
    time: '全天开放', ticket: '前山\u00A580 \u00B7 后山\u00A520', hot: 4,
    tip: '懒人路线：索道上山 + 步行下山，顺路在山脚泡一盏青城雪芽。' },
  { id: 'kz',       name: '宽窄巷子',     en: 'KUANZHAI ALLEY',  emoji: '\uD83E\uDDF1', cat: 'oldtown', x: 45, y: 53,
    desc: '宽巷子休闲、窄巷子慢行、井巷子市井，老成都的三种打开方式。',
    time: '全天开放', ticket: '免费 \u00B7 巷内消费', hot: 5,
    tip: '傍晚去最有氛围，掏耳朵 + 三大炮 + 糖油果子，一样都别落下。' },
  { id: 'park',     name: '人民公园',     en: 'PEOPLE PARK',     emoji: '\uD83C\uDF75', cat: 'oldtown', x: 54, y: 58,
    desc: '鹤鸣茶社的盖碗茶从早续到晚，竹椅、麻将与掏耳师傅共同营业。',
    time: '06:30-22:00', ticket: '免费 \u00B7 茶\u00A515起', hot: 4,
    tip: '点一碗茉莉花茶坐进竹林，体验 15 分钟采耳，才算解锁成都下午。' },
  { id: 'dufu',     name: '杜甫草堂',     en: 'DU FU COTTAGE',   emoji: '\uD83D\uDCDC', cat: 'culture', x: 30, y: 63,
    desc: '茅屋、竹影、红墙夹道，诗圣在成都写下的 240 多首诗从这里长出来。',
    time: '09:00-18:00', ticket: '\u00A550', hot: 3,
    tip: '红墙竹影是必拍机位，绿瓦白墙配马卡龙滤镜，随手一拍都是明信片。' },
  { id: 'wuhou',    name: '武侯祠',       en: 'WUHOU SHRINE',    emoji: '\uD83C\uDFEF', cat: 'culture', x: 31, y: 75,
    desc: '君臣合祀的三国圣地，出师表刻满回廊，红墙绿瓦藏着千年风云。',
    time: '09:00-18:00', ticket: '\u00A550 \u00B7 锦里联通', hot: 3,
    tip: '跟着讲解听三国才过瘾，逛完从侧门直接溜进锦里吃小吃。' },
  { id: 'jinli',    name: '锦里古街',     en: 'JINLI STREET',    emoji: '\uD83C\uDFEE', cat: 'oldtown', x: 41, y: 68,
    desc: '夜幕灯笼亮起就是锦里的高光时刻，糖画、兔头、蛋烘糕全部就位。',
    time: '全天 \u00B7 夜景最佳', ticket: '免费 \u00B7 小吃\u00A55起', hot: 5,
    tip: '18 点后来看红灯笼，排队也要吃的三大炮，甜醪糟当宵夜刚好。' },
  { id: 'chunxi',   name: '春熙路\u00B7太古里', en: 'CHUNXI ROAD', emoji: '\uD83D\uDECD', cat: 'oldtown', x: 60, y: 43,
    desc: '老牌商圈混搭新潮街巷，IFS 爬墙熊猫在楼顶憨憨打卡合影。',
    time: '全天 \u00B7 商场 10 点起', ticket: '免费 \u00B7 钱包预警', hot: 4,
    tip: '先去 IFS 楼下排队和爬墙熊猫合影，再钻进太古里的里巷逛买逛吃。' },
  { id: 'yulin',    name: '玉林路',       en: 'YULIN ROAD',      emoji: '\uD83C\uDFB8', cat: 'oldtown', x: 52, y: 73,
    desc: '《成都》唱的小酒馆就在这里，深夜民谣、火锅香气与慢生活同频。',
    time: '全天 \u00B7 酒馆夜开', ticket: '免费 \u00B7 微醺自付', hot: 4,
    tip: '傍晚去小酒馆门口坐坐，再拐进玉林菜市街边吃小吃边听民谣。' }
];
var SCENE_ART = {
  panda: 'images/scene-panda-base.jpg', dam: 'images/scene-dujiangyan.jpg', qing: 'images/scene-qingchengshan.jpg', kz: 'images/scene-kuanzhai.jpg',
  park: 'images/scene-renmin-park.jpg', dufu: 'images/scene-dufu-cottage.jpg', wuhou: 'images/scene-wuhou-shrine.jpg',
  jinli: 'images/scene-jinli.jpg', chunxi: 'images/scene-chunxi-ifs.jpg', yulin: 'images/scene-yulin-pub.jpg'
};
var currentSpot = null;
function initMap() {
  var layer = $('#mapLayer'), stage = $('#mapStage'), popup = $('#mapPopup'), legend = $('#mapLegend');
  if (!layer || !stage) return;
  var lhtml = '';
  Object.keys(CATS).forEach(function (k) {
    lhtml += '<li class="legend-chip"><i class="legend-dot" style="--c:' + CATS[k].color + '"></i>' + CATS[k].emoji + ' ' + CATS[k].name + '</li>';
  });
  legend.innerHTML = lhtml;
  var frag = document.createDocumentFragment();
  SPOTS.forEach(function (s, i) {
    var m = document.createElement('button');
    m.className = 'marker';
    m.type = 'button';
    m.setAttribute('aria-label', '查看 ' + s.name + ' 笔记');
    m.setAttribute('data-id', s.id);
    m.style.left = s.x + '%';
    m.style.top = s.y + '%';
    m.style.setProperty('--mc', CATS[s.cat].color);
    m.style.setProperty('--d', (i * 0.07) + 's');
    m.innerHTML = '<span class="marker-pin"><i class="marker-emoji">' + s.emoji + '</i></span><span class="marker-label">' + s.name + '</span>';
    frag.appendChild(m);
  });
  layer.appendChild(frag);
  if (!('IntersectionObserver' in window)) { stage.classList.add('is-in'); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { stage.classList.add('is-in'); io.disconnect(); } });
    }, { threshold: 0.22 });
    io.observe(stage);
  }
  layer.addEventListener('click', function (e) {
    var m = e.target.closest('.marker');
    if (m) openSpot(m.getAttribute('data-id'));
  });
  stage.addEventListener('click', function (e) {
    if (!e.target.closest('.marker') && !e.target.closest('.map-popup')) closePopup();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });
  window.addEventListener('resize', function () {
    if (!currentSpot) return;
    var m = layer.querySelector('.marker[data-id="' + currentSpot + '"]');
    if (m) placePopup(m);
  });
}
function closePopup() {
  currentSpot = null;
  var popup = $('#mapPopup');
  if (popup) popup.classList.remove('is-open');
  $$('.marker.is-selected').forEach(function (m) { m.classList.remove('is-selected'); });
}
function openSpot(id) {
  var s = null;
  SPOTS.forEach(function (x) { if (x.id === id) s = x; });
  if (!s) return;
  var layer = $('#mapLayer'), popup = $('#mapPopup');
  $$('.marker.is-selected').forEach(function (m) { m.classList.remove('is-selected'); });
  var m = layer.querySelector('.marker[data-id="' + id + '"]');
  if (m) m.classList.add('is-selected');
  var c = CATS[s.cat];
  var artId = SCENE_ART[s.id] || 'images/scene-panda-base.jpg';
  popup.innerHTML =
    '<div class="popup-art" aria-hidden="true"><img src="' + artId + '" alt="" aria-hidden="true"></div>' +
    '<span class="popup-cat" style="--pc:' + c.color + '">' + c.emoji + ' ' + c.name + '</span>' +
    '<h3 class="popup-name">' + s.name + '</h3>' +
    '<p class="popup-en">' + s.en + '</p>' +
    '<p class="popup-desc">' + s.desc + '</p>' +
    '<div class="popup-meta">' +
      '<span class="meta-chip">⏱ ' + s.time + '</span>' +
      '<span class="meta-chip">🎫 ' + s.ticket + '</span>' +
      '<span class="meta-chip">🔥 热度 ×' + s.hot + '</span>' +
    '</div>' +
    '<p class="popup-tip">🐾 局长笔记：' + s.tip + '</p>' +
    '<div class="popup-foot">' +
      '<a class="popup-link" href="#food">查看美食攻略 →</a>' +
      '<button class="heart-btn" type="button" data-key="spot-' + s.id + '" data-name="' + s.name + '" aria-pressed="false" aria-label="收藏 ' + s.name + '"><svg viewBox="0 0 32 30" aria-hidden="true"><use href="#kx-heart"/></svg></button>' +
    '</div>';
  currentSpot = id;
  placePopup(m);
  popup.classList.add('is-open');
  syncFavUI();
}
function placePopup(marker) {
  var stage = $('#mapStage'), popup = $('#mapPopup');
  var w = stage.clientWidth, h = stage.clientHeight;
  var px = marker.offsetLeft, py = marker.offsetTop;
  var pw = popup.offsetWidth || 284, ph = popup.offsetHeight || 260;
  popup.classList.toggle('flip-x', px > w - pw / 2 - 12);
  popup.classList.toggle('flip-y', py - ph - 26 < 0);
  popup.style.left = marker.style.left;
  popup.style.top = marker.style.top;
}
/* ---------- 12 美食翻牌 ---------- */
function initFood() {
  $$('.food-card').forEach(function (card) {
    function flip() {
      var on = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      flip();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  });
}

function initBackTop() {
  var btn = $('#backTop');
  if (!btn) return;
  btn.addEventListener('click', function () {
    btn.classList.add('is-roll');
    setTimeout(function () { btn.classList.remove('is-roll'); }, 900);
    window.scrollTo({ top: 0, behavior: MOTION_OK ? 'smooth' : 'auto' });
  });
  onScrollBus(function () { btn.classList.toggle('is-show', window.scrollY > 640); });
}

/* ---------- 17 吉祥物彩蛋 + 键盘彩蛋 ---------- */
function initHeroEgg() {
  var panda = $('#heroPanda'), bubble = $('#heroBubble');
  if (!panda) return;
  var lines = [
    '戳我一下嘛 (＾▽＾)', '嘿嘿，竹子分你一根 \uD83C\uDF8B', '局长提醒：微辣也很好吃！',
    '要不要去地图上寻宝呀？', '今天也是想滚的一天 \u2639', '盖碗茶配采耳，绝了～'
  ];
  var busy = false;
  panda.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    panda.classList.add('is-jump');
    var pool = lines.filter(function (l) { return l !== bubble.textContent; });
    if (bubble) bubble.textContent = pick(pool.length ? pool : lines);
    var r = panda.getBoundingClientRect();
    burstHearts(r.left + r.width / 2, r.top + r.height * 0.35, 8);
    setTimeout(function () { panda.classList.remove('is-jump'); busy = false; }, 820);
  });
}
function startPandaRain() {
  var i, spawn = function () {
    var el = document.createElement('span');
    el.className = 'panda-rain';
    el.style.left = rand(2, 92) + 'vw';
    el.style.width = rand(26, 54).toFixed(0) + 'px';
    el.style.setProperty('--dur', rand(2.8, 4.8).toFixed(2) + 's');
    el.style.setProperty('--sway', rand(16, 46).toFixed(0) + 'px');
    el.style.setProperty('--spin', (rand(0, 1) < .5 ? -1 : 1) * rand(12, 32).toFixed(0) + 'deg');
    el.innerHTML = '<img src="images/panda-head.svg" alt="" aria-hidden="true">';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 5600);
  };
  for (i = 0; i < 16; i++) setTimeout(spawn, i * rand(130, 260));
}
function initSecretEgg() {
  var seq = ['p', 'a', 'n', 'd', 'a'], buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    buf = (buf + String(e.key).toLowerCase()).slice(-seq.length);
    if (buf === seq.join('')) {
      buf = '';
      toast('\uD83D\uDC3C', '密码正确！普通熊猫雨降落～');
      startPandaRain();
    }
  });
}

/* ---------- 市井烟火卡片点击反馈 ---------- */
function initLife() {
  $$('.life-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var title = card.querySelector('.life-title');
      var text = title ? title.textContent : '这个地方';
      toast('🏮', '想去「' + text + '」逛逛～');
      card.classList.add('is-tap');
      setTimeout(function () { card.classList.remove('is-tap'); }, 220);
    });
  });
}

/* ---------- 17.5 宣传影片（点击播放/暂停 + 静音开关，状态交由 CSS 类切换） ---------- */
function initFilm() {
  var video = $('#filmVideo'), screen = video && video.parentNode, btn = $('#filmPlay');
  if (!video || !screen || !btn) return;
  var toggle = function () {
    if (video.paused) { video.play(); } else { video.pause(); }
  };
  btn.addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  video.addEventListener('play', function () {
    screen.classList.add('is-playing');
    btn.setAttribute('aria-pressed', 'true');
  });
  video.addEventListener('pause', function () {
    screen.classList.remove('is-playing');
    btn.setAttribute('aria-pressed', 'false');
  });
  video.addEventListener('ended', function () {
    screen.classList.remove('is-playing');
    btn.setAttribute('aria-pressed', 'false');
  });
  var muteBtn = $('#filmMute');
  if (muteBtn) {
    video.muted = true;
    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
      muteBtn.setAttribute('aria-label', video.muted ? '打开声音' : '静音');
      muteBtn.title = video.muted ? '打开声音' : '静音';
    });
  }
  var playTxt = $('#filmPlayTxt');
  video.addEventListener('loadedmetadata', function () {
    if (playTxt && video.duration && isFinite(video.duration)) {
      playTxt.textContent = '播放影片 · ' + Math.round(video.duration) + '\u2033';
    }
  });
}

/* ---------- 18 初始化 ---------- */
(function init() {
  toastEl = $('#toast'); toastIco = $('#toastIco'); toastText = $('#toastText');
  initScrollBus();
  initLoading();
  initBgDeco();
  initLeaves();
  initTicker();
  initNav();
  initReveal();
  initHearts();
  initMap();
  initFood();
  initLife();
  initFilm();
  initBackTop();
  initHeroEgg();
  initSecretEgg();
  onScrollBus(updateNavSpy);
  syncFavUI();
})();
