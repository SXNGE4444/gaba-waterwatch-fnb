'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/index.html','utf8');
const js=fs.readFileSync('public/app.js','utf8');
const css=fs.readFileSync('public/brand-v07.css','utf8');
test('website has distinct site and two product experiences',()=>{
  assert.match(html,/class="site-shell"/);assert.match(html,/data-switch="operator"/);assert.match(html,/data-switch="community"/);
});
test('site opens by default on web, native defaults to community',()=>{
  assert.match(js,/isNativePlatform/);assert.match(js,/native\?'community':'site'/);assert.match(js,/mode-site/);
});
test('page assets resolve under both custom domain and GitHub Pages',()=>{
  assert.match(html,/gaba-waterwatch-fnb-downloads\/gabafnbhackaton/);
  assert.match(html,/gabafnbhackaton\//);
});
test('brand imagery is local and clearly identified',()=>{
  assert.match(css,/gaba-waterfall\.jpg/);assert.ok(fs.statSync('public/assets/gaba-waterfall.jpg').size>10000);
  assert.match(html,/Synthetic incidents|Synthetic incidents|Synthetic water|Synthetic incidents|Synthetic incidents|Synthetic incidents|Synthetic incidents|Synthetic incidents|Synthetic incidents|synthetic/i);
});
