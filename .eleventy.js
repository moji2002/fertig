/* Builds the marketing site into dist/ with Eleventy.
   Input  : src/  (page templates + _data + _includes)
   Output : dist/ (static site, deploy target for GitHub Pages)

   The npm package stays fully decoupled: package.json's "files" only ships
   the library css/readme (root files), and nothing the site needs is copied
   into the repo twice — every static asset below is passthrough-copied from
   its single root location, never duplicated under src/.
*/
const { version } = require('./package.json');

module.exports = function (eleventyConfig) {
  // library + site assets: one copy on disk, referenced as-is.
  eleventyConfig.addPassthroughCopy('fertig.css');
  eleventyConfig.addPassthroughCopy('fertig.min.css');
  eleventyConfig.addPassthroughCopy('site.css');
  eleventyConfig.addPassthroughCopy('site.js');
  eleventyConfig.addPassthroughCopy('favicon.svg');
  eleventyConfig.addPassthroughCopy('icons.svg');
  eleventyConfig.addPassthroughCopy('llms.txt');
  eleventyConfig.addPassthroughCopy('sitemap.xml');

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data',
    },
  };
};
