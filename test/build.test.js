const test = require('node:test');
const assert = require('node:assert/strict');
const { minifyCss } = require('../build.js');

test('minification preserves descendant combinators before pseudo selectors', () => {
  const css = 'nav :is(strong, b) a { color: red; }';

  assert.equal(minifyCss(css), 'nav :is(strong,b) a{color:red}');
});

test('minification leaves quoted content untouched', () => {
  const css = 'a::after { content: "label: value; /* literal */ #aabbcc"; }';

  assert.equal(
    minifyCss(css),
    'a::after{content:"label: value; /* literal */ #aabbcc"}',
  );
});

test('apostrophes inside comments cannot swallow rules', () => {
  const css = "/* the body's shell */ main { display: block; }";

  assert.equal(minifyCss(css), 'main{display:block}');
});
