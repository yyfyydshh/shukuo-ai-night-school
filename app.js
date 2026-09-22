'use strict';
document.documentElement.classList.add('js');
const scenes = [...document.querySelectorAll('.scene')];
const $ = (selector, root = document) => root.querySelector(selector);
let current = 0;
let navigationPending = false;
let navigationTimer;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dialogs = [...document.querySelectorAll('dialog')];
const pad = n => String(n).padStart(2, '0');
let noticeTimer;
function notice(text) {
  const el = $('#notice'); el.textContent = text; el.classList.add('visible');
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}
function updateNotes() {
  $('#notes-title').textContent = `${pad(current + 1)} / ${scenes[current].dataset.title}`;
  $('#notes-text').textContent = scenes[current].dataset.note;
  $('#notes-prev').disabled = current === 0;
  $('#notes-next').disabled = current === scenes.length - 1;
}
function setCurrent(index) {
  current = index;
  $('#current-number').textContent = pad(index + 1);
  $('#current-title').textContent = scenes[index].dataset.title;
  $('#progress-fill').style.transform = `scaleX(${(index + 1) / scenes.length})`;
  $('#prev').disabled = index === 0; $('#next').disabled = index === scenes.length - 1;
  document.querySelectorAll('[data-scene-nav]').forEach(button => {
    const active = Number(button.dataset.sceneNav) === index;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('.chapter-rail button').forEach(button => {
    const active = Number(button.dataset.goto) === index;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  $('.chapter-rail').dataset.tone = scenes[index].classList.contains('dark') ? 'dark' : 'light';
  scenes.forEach((scene, i) => { if(i !== index) scene.querySelectorAll('video').forEach(video => video.pause()); });
  try { history.replaceState(null, '', '#' + scenes[index].id); } catch {}
  updateNotes();
}
function goTo(index, close = true) {
  index = Math.max(0, Math.min(scenes.length - 1, index));
  if (close) dialogs.forEach(dialog => { if(dialog.open) dialog.close(); });
  // Keep the selected destination steady while a page jump passes other scenes.
  navigationPending = true;
  clearTimeout(navigationTimer);
  navigationTimer = setTimeout(finishNavigation, 250);
  setCurrent(index);
  scenes[index].classList.add('in-view');
  scenes[index].scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block:'start'});
}
$('#total-number').textContent = pad(scenes.length);
const chapterList = $('#chapter-list');
const rail = $('.chapter-rail');
scenes.forEach((scene, i) => {
  const button = document.createElement('button');
  button.dataset.sceneNav = i;
  const number = document.createElement('span'); number.textContent = pad(i + 1);
  button.append(number, document.createTextNode(scene.dataset.title));
  button.addEventListener('click', () => goTo(i)); chapterList.append(button);
  const dot = document.createElement('button'); dot.dataset.goto = i;
  dot.title = `${pad(i + 1)} · ${scene.dataset.title}`;
  dot.setAttribute('aria-label', `跳转到第 ${i + 1} 页：${scene.dataset.title}`);
  rail.append(dot);
});
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('in-view'); });
}, {threshold:.08});
scenes.forEach(scene => revealObserver.observe(scene));
let scrollTick = false;
function syncCurrentToViewport() {
  const focusY = innerHeight * .45;
  const active = scenes.findIndex(scene => { const r = scene.getBoundingClientRect(); return r.top <= focusY && r.bottom > focusY; });
  if(active >= 0 && active !== current) setCurrent(active);
}
function finishNavigation() {
  clearTimeout(navigationTimer);
  navigationPending = false;
  syncCurrentToViewport();
}
['wheel', 'touchstart'].forEach(type => window.addEventListener(type, finishNavigation, {passive:true}));
window.addEventListener('scroll', () => {
  if(navigationPending) {
    clearTimeout(navigationTimer);
    navigationTimer = setTimeout(finishNavigation, 160);
    return;
  }
  if(scrollTick) return; scrollTick = true;
  requestAnimationFrame(() => {
    if(!navigationPending) syncCurrentToViewport();
    scrollTick = false;
  });
}, {passive:true});
$('#prev').addEventListener('click', () => goTo(current - 1));
$('#next').addEventListener('click', () => goTo(current + 1));
document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => goTo(current + 1)));
document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.goto))));
function showDialog(id) { dialogs.forEach(d => {if(d.open) d.close();}); $(id).showModal(); }
$('#menu-open').addEventListener('click', () => showDialog('#chapter-dialog'));
$('#notes-open').addEventListener('click', () => {updateNotes(); showDialog('#notes-dialog');});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
dialogs.forEach(dialog => dialog.addEventListener('click', event => {
  if(event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
}));
$('#notes-prev').addEventListener('click', () => goTo(current - 1, false));
$('#notes-next').addEventListener('click', () => goTo(current + 1, false));
async function fullscreen() {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else notice('当前浏览器不支持网页全屏，请使用浏览器的全屏功能。');
  } catch { notice('当前环境无法进入网页全屏，可在浏览器中按 F11。'); }
}
$('#fullscreen').addEventListener('click', fullscreen);
document.addEventListener('fullscreenchange', () => { $('#fullscreen').innerHTML = document.fullscreenElement ? '退出全屏 <span aria-hidden="true">⛶</span>' : '全屏 <span aria-hidden="true">⛶</span>'; });
document.addEventListener('keydown', event => {
  if(event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  const editing = event.target.closest('input, textarea, select, [contenteditable="true"], video');
  if(editing || dialogs.some(d => d.open)) return;
  const k = event.key.toLowerCase();
  if(k === 'f') {event.preventDefault(); fullscreen(); return;}
  if(k === 'g') {event.preventDefault(); showDialog('#chapter-dialog'); return;}
  if(k === 'n') {event.preventDefault(); updateNotes(); showDialog('#notes-dialog'); return;}
  if(event.target.closest('button,a') && (k === ' ' || k === 'enter')) return;
  if(['arrowdown','arrowright','pagedown',' '].includes(k)) {event.preventDefault(); goTo(current + 1);}
  if(['arrowup','arrowleft','pageup'].includes(k)) {event.preventDefault(); goTo(current - 1);}
  if(k === 'home') {event.preventDefault(); goTo(0);}
  if(k === 'end') {event.preventDefault(); goTo(scenes.length - 1);}
});
// Media sources remain local. A selected File is used only for this page session.
const objectUrls = new Map();
function loadVideo(kind, source) {
  const stage = $(`[data-media="${kind}"]`), video = $('video', stage), empty = $('.media-empty', stage);
  video.src = source; video.hidden = false; empty.hidden = true; $('.media-replace', stage).hidden = false;
  video.load();
}
document.querySelectorAll('[data-video-input]').forEach(input => input.addEventListener('change', () => {
  const file = input.files[0]; if(!file) return;
  const kind = input.dataset.videoInput;
  if(!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) { notice('请选择 MP4 或 WebM 视频。'); return; }
  if(objectUrls.has(kind)) URL.revokeObjectURL(objectUrls.get(kind));
  const url = URL.createObjectURL(file); objectUrls.set(kind, url); loadVideo(kind, url);
  notice('已接入本地视频。文件不会上传；临时替换在刷新后失效。');
}));
document.querySelectorAll('[data-replace]').forEach(button => button.addEventListener('click', () => $(`[data-video-input="${button.dataset.replace}"]`).click()));
document.querySelectorAll('.media-stage video').forEach(video => video.addEventListener('error', () => {
  const stage = video.closest('.media-stage'); video.hidden = true; $('.media-empty', stage).hidden = false;
  $('.media-status', stage).textContent = '视频未能加载，请重新选择本地 MP4 / WebM 文件。';
  $('.media-replace', stage).hidden = true;
}));
for(const [kind, source] of Object.entries(window.NIGHT_SCHOOL_MEDIA || {})) if(source && $(`[data-media="${kind}"]`)) loadVideo(kind, source);
window.addEventListener('beforeunload', () => objectUrls.forEach(url => URL.revokeObjectURL(url)));
// Scene interactions are owned by story.js.
const initial = scenes.findIndex(scene => '#' + scene.id === location.hash);
setCurrent(initial >= 0 ? initial : 0);
scenes[current].classList.add('in-view');
if(initial >= 0) requestAnimationFrame(() => scenes[initial].scrollIntoView({behavior:'instant'}));
