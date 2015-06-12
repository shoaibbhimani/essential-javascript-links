/*
  How it _should_ work:
  - if the json exists, open and index it (by href?)
  - open and cleanup the markdown
  - iterate over lines:
    - case category: allCategories.push, make current
    - case link: merge with old meta, link.categories.push[cat], allLinks.push
  - stringify and write
 */

var FS = require('fs'),
    Path = require('path'),
    _ = require('lodash');

(function md_import() {
  var argv = process.argv,
      cfg = {
        linksID: 'allTheLinks',
        catsID: 'categories',
        spaces: 2,
        source: argv[2],
        destination: argv[3]
      },
      oldTree, newTree, oldTreeIndex, md;

  // check cli arguments
  if ( !(cfg.source) || !(cfg.destination) )
    return console.error('Usage: <source.md> <destination.json>');

  // try and import the old JSON data (or at leas create structure)
  oldTree = readJson_maybe(cfg.destination);
  oldTreeIndex = _.indexBy(oldTree, cfg.linksID);

  // read and parse markdown (merging the old JSON)
  md = getMdLines(Path.resolve(cfg.source));
  newTree = parseMarkdown(md, oldTreeIndex);

  // write the JSON
  writeJson(cfg.destination, newTree, cfg.spaces);
})();

function readJson_maybe(file) {
  var tree;

  try {
    tree = JSON.parse(FS.readFileSync(file, 'utf8'));
  }
  catch (e) {
    tree = {};
    tree[cfg.linksID] = [];
    tree[cfg.catsID] = [];
  }

  return tree;
}

function getMdLines(file) {
  var buffer = '';

  try {
    buffer = FS.readFileSync(file, {encoding: 'UTF-8', flag: 'r'});
  }
  catch (e) {
    console.error('Couldn\'t open ' + Path.resolve(file));
    process.exit(1);
  }

  return inputCleanup(buffer).split(/\r?\n/);
}

function inputCleanup(string) {
  // $TODO
  return string;
}

function parseMarkdown(lines, oldJsonIndex) {
  var categories = {},
      links = {},
      cat = '-',
      tree = {},
      linksIndex = {};

  lines.forEach(parseLine);
  tree[cfg.linksID] = links;
  tree[cfg.catsID] = categories;
  return tree;

  function parseLine(line) {
    var match, link, meta, href;

    if ( match = line.match(/^\s*#+\s(.*)$/) ) {
      // Category header
      categories.push(cat = match[1]);
    } else if ( match = line.match(/^\s*[\*\+\-]\s+\[(.+?)\]\((.+?)\)(\s+(.*))?$/) ) {
      // check for dupes
      href = match[2];
      if (_.has(linksIndex, href))
        return;

      link = {
        title: match[1],
        href:  href,
        short_description: match[4],
        categories: [cat]
      };

      // merge old meta
      if (meta = oldJsonIndex[href])
        link = _.merge(meta, link);

      links.push(link);
      linksIndex[href] = link;
    }
  }
}

function writeJson(file, tree, spaces) {
  spaces || (spaces = 2);
  var theBigString = JSON.stringify(tree, null, spaces);

  try {
    FS.writeFileSync(file, theBigString);
  }
  catch (e) {
    console.error('Couldn\'t write' + Path.resolve(jsonOutPath));
    process.exit(1);
  }
}

function t(s,d){
  for(var p in d)
    s=s.replace(new RegExp('{'+p+'}','g'), d[p]);
  return s;
}
