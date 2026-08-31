const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');
const { version } = require('../../package.json');

/* Asset URLs carry a content hash. GitHub Pages serves the stylesheets from a
   fixed path with `cache-control: max-age=600` and no version in the URL, so a
   redeploy left browsers on whatever they had already fetched — long enough
   that Safari and Chrome showed the same page from two different builds and
   looked like they were rendering it differently. The hash changes only when
   the file does, so an unchanged asset stays cached. */
const hash = (file) =>
  createHash('sha256').update(readFileSync(join(__dirname, '../..', file)))
    .digest('hex').slice(0, 8);

module.exports = {
  version,
  h: {
    fertig: hash('fertig.css'),
    site: hash('site.css'),
    js: hash('site.js'),
  },
};
