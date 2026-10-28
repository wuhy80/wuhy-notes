#!/usr/bin/env node
/**
 * skin-switcher.cjs —— 皮肤切换器注入（四主题可选）
 *
 * 为什么放在这一层：与 enhance-content.cjs / add-edit-links.cjs 同理，
 * Quartz 没有顶栏工具栏插槽，改组件要维护 fork；在产物上注入零维护。
 *
 * 做法（全部走客户端 DOM，不做正文/工具栏的字符串手术）：
 *   · 每页 <head> 开头注入一段内联脚本（整个站点唯一一处字符串插入点，
 *     <head> 前面只有 doctype/<html>，不存在误匹配）：
 *     ① 读 localStorage('gz-skin') 应用 <html data-gz-skin>；没有保存过则按
 *        系统明暗给默认（浅色→瓷白，深色→曜夜）。放最前是为了在 CSS 取变量
 *        前定好皮肤，避免换肤闪一下。
 *     ② place()：在真实 DOM 里找到 .darkmode 按钮，把它所在 .flex-component
 *        的前面插一份 .gz-skin-dd 下拉。DOM 查询天然不会命中 head 里内联的
 *        序列化字符串（那是字符串手术踩过的坑）。顶栏（深色固定栏）复用的
 *        就是左栏这套工具栏 DOM，一份注入两处可见。
 *   · SPA 导航后监听 Quartz 的 nav 事件重新 place + 重申皮肤属性
 *     （micromorph 可能重置 <html> 属性），保证切页后不丢。
 *
 * 皮肤取值与含义（CSS 端见 site-custom.scss 末尾「12/12 皮肤系统」）：
 *   paper  纸墨 · 现版（暖纸赭橙观感，保留为可选主题）
 *   xuanmo 玄墨书卷（宋体标题 + 朱砂印章色）
 *   yaoye  曜夜终端（深色青荧光 + 等宽点缀；浅色档为青瓷纸面）
 *   cibai  瓷白编辑部（特黑标题 + 靛蓝强调）
 *
 * 幂等：已含 gz-skin-boot 的页面直接跳过，可安全重复执行。
 *
 * 用法：node scripts/skin-switcher.cjs <public 目录> [--dry]
 */
'use strict'

const fs = require('fs')
const path = require('path')

const PUB = process.argv[2] || 'public'
const DRY = process.argv.includes('--dry')

const HEAD_SCRIPT = `<script>(function(){
var K=["paper","xuanmo","yaoye","cibai"];
function cur(){var s=null;try{s=localStorage.getItem("gz-skin")}catch(e){}
if(K.indexOf(s)<0){try{s=matchMedia("(prefers-color-scheme: dark)").matches?"yaoye":"cibai"}catch(e){s="cibai"}}
return s}
function apply(){document.documentElement.setAttribute("data-gz-skin",cur())}
apply();
if(!window.__gzSkinBoot){window.__gzSkinBoot=1;
var PALETTE='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>';
var SKINS=[["paper","纸墨 · 现版"],["xuanmo","玄墨书卷"],["yaoye","曜夜终端"],["cibai","瓷白编辑部"]];
var MODES=[["light","浅色"],["dark","深色"],["auto","跟随系统"]];
function curMode(){var m=null;try{m=localStorage.getItem("theme")}catch(e){}
return (m==="light"||m==="dark")?m:"auto"}
function applyMode(){var m=curMode();if(m==="auto"){return}
document.documentElement.setAttribute("saved-theme",m);
document.body&&(document.body.classList.remove("theme-dark","theme-light"),document.body.classList.add("theme-"+m));
document.dispatchEvent(new CustomEvent("themechange",{detail:{theme:m}}))}
function place(){
if(document.querySelector(".gz-skin-dd"))return;
var dm=document.querySelector(".darkmode");if(!dm)return;
var fc=dm.closest(".flex-component");if(!fc||!fc.parentNode)return;
var d=document.createElement("details");d.className="gz-skin-dd";
var sum=document.createElement("summary");sum.setAttribute("aria-label","切换皮肤与明暗");sum.title="切换皮肤与明暗";sum.innerHTML=PALETTE;d.appendChild(sum);
var menu=document.createElement("div");menu.className="gz-skin-menu";menu.setAttribute("role","menu");menu.setAttribute("aria-label","皮肤与明暗");
var g1=document.createElement("div");g1.className="gz-skin-group";g1.textContent="皮肤";menu.appendChild(g1);
SKINS.forEach(function(s){var b=document.createElement("button");b.type="button";b.setAttribute("role","menuitemradio");b.setAttribute("aria-checked","false");b.setAttribute("data-gz-skin",s[0]);
b.innerHTML='<span class="gz-skin-dot gz-skin-dot-'+s[0]+'" aria-hidden="true"></span>'+s[1]+'<span class="gz-skin-tick" aria-hidden="true">✓</span>';
menu.appendChild(b)});
var g2=document.createElement("div");g2.className="gz-skin-group";g2.textContent="明暗";menu.appendChild(g2);
MODES.forEach(function(m){var b=document.createElement("button");b.type="button";b.setAttribute("role","menuitemradio");b.setAttribute("aria-checked","false");b.setAttribute("data-gz-mode",m[0]);
b.innerHTML='<span class="gz-mode-ic gz-mode-'+m[0]+'" aria-hidden="true"></span>'+m[1]+'<span class="gz-skin-tick" aria-hidden="true">✓</span>';
menu.appendChild(b)});
d.appendChild(menu);
// 插进工具栏行（.flex-component）内部作为第一项：顶栏把这一整行 fixed 到右上，
// 插在行外会留在侧栏文档流里被顶栏挡住
fc.insertBefore(d, fc.firstChild)}
function sync(m){
var c=cur(), mo=curMode();
Array.prototype.forEach.call(m.querySelectorAll("button[data-gz-skin]"),function(x){x.setAttribute("aria-checked",x.getAttribute("data-gz-skin")===c?"true":"false")});
Array.prototype.forEach.call(m.querySelectorAll("button[data-gz-mode]"),function(x){x.setAttribute("aria-checked",x.getAttribute("data-gz-mode")===mo?"true":"false")})}
document.addEventListener("click",function(ev){
if(!ev.target||!ev.target.closest)return;
// ⚠️ 必须限定 button：<html> 自身带 data-gz-skin，用裸属性选择器会把明暗按钮
// 误判成皮肤按钮（closest 一路匹配到 html），明暗切换于是静默失效
var b=ev.target.closest("button[data-gz-skin]");
if(b){try{localStorage.setItem("gz-skin",b.getAttribute("data-gz-skin"))}catch(e){}
apply();sync(b.parentNode);var dd=b.closest(".gz-skin-dd");if(dd)dd.removeAttribute("open");return}
var mb=ev.target.closest("button[data-gz-mode]");
if(mb){var m=mb.getAttribute("data-gz-mode");
try{if(m==="auto"){localStorage.removeItem("theme")}else{localStorage.setItem("theme",m)}}catch(e){}
if(m==="auto"){try{document.documentElement.setAttribute("saved-theme",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}}
applyMode();sync(mb.parentNode);var dd2=mb.closest(".gz-skin-dd");if(dd2)dd2.removeAttribute("open");return}
Array.prototype.forEach.call(document.querySelectorAll("details.gz-skin-dd[open]"),function(d){
if(!d.contains(ev.target))d.removeAttribute("open")})});
document.addEventListener("toggle",function(ev){
if(ev.target&&ev.target.classList&&ev.target.classList.contains("gz-skin-dd")&&ev.target.hasAttribute("open"))
sync(ev.target)},true);
document.addEventListener("nav",function(){apply();place()});
function boot(){place()}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot)}else{boot()}
}})()</script>`

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.html')) out.push(p)
  }
  return out
}

const files = walk(PUB, [])
let injected = 0
let skipped = 0
let noHead = 0
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  if (html.includes('gz-skin-boot') || html.includes('__gzSkinBoot')) { skipped++; continue }

  // 唯一的字符串插入点：<head> 之后（其前只有 doctype/<html>，无误匹配可能）
  const headIdx = html.indexOf('<head>')
  if (headIdx < 0) { noHead++; continue }
  const headAt = headIdx + '<head>'.length

  if (!DRY) {
    fs.writeFileSync(file, html.slice(0, headAt) + HEAD_SCRIPT + html.slice(headAt), 'utf8')
  }
  injected++
}

console.log('skin-switcher: 注入 ' + injected + '/' + files.length + ' 页' +
  (skipped ? '，跳过 ' + skipped + ' 页（已有切换器）' : '') +
  (noHead ? '，跳过 ' + noHead + ' 页（无 head）' : '') +
  (DRY ? '（--dry 未写盘）' : ''))
