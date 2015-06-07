var fs = require('fs'),
    path = require('path');

var argv = process.argv,
    markdownPath, jsonOutPath, moreMetaData;

if ( !(markdownPath = argv[2]) ||
     !(jsonOutPath = argv[3]) )
  return console.error('Usage: <source.md> <destination.json> [<data-to-merge.json> [varInTheMergeData]]');

if (argv[4])
  moreMetaData = {
    path: argv[4],
    id: argv[5] || path.base(argv[4], '.json')
  };

fs.readFile(markdownPath, {encoding: 'UTF-8', flag: 'r'}, function (err, data) {
	if (err)
    return console.error('Couldn\'t open ' + path.resolve(markdownPath));

  var allLinks = [],
      categories = [];
      currentCategory = "",
      current = {},
      moreMeta = [],
      moreMetaIndex = {},
      currentMeta = {},
      currentMetaIndex = {};

  if (moreMetaData) {
    try {
      var moreMetaString = fs.readFileSync(moreMetaData.path, 'utf8');
    }
    catch (e) {
      return console.error('Couldn\'t open ' + path.resolve(moreMetaData.path));
    }

    if (!(moreMeta = JSON.parse(moreMetaString)[moreMetaData.id]))
      return console.error('Couln\'t get a value of ' + moreMetaData.id + ' from ' + moreMetaData.path);

    moreMeta.forEach(function(el) {
      moreMetaIndex[el.title] = el.items;
    });
  }

	data.split(/\r?\n/).forEach( function(line) {
    var match;

    if ( match = line.match(/^\s*#+\s(.*)$/) ) {
      // Category header
      currentCategory = match[1];
      categories.push(currentCategory);

      if (currentMeta = moreMetaIndex[currentCategory]) {
        currentMetaIndex = [];
        currentMeta.forEach(function(el, i) {
          currentMetaIndex[el.title] = el;
        });
      }
    } else if ( match = line.match(/^\s*[\*\+\-]\s+\[(.+?)\]\((.+?)\)(\s+(.*))?$/) ) {
      current = {
        title: match[1],
        href:  match[2],
        short_description: match[4],
        categories: [currentCategory]
      };

      if (moreMetaData)
        enhanceMeta(current, currentMetaIndex[current.title]);
      allLinks.push(current);
    }

    function enhanceMeta(rec, meta) {
      if (!meta || typeof meta != 'object')
        return;

      if (meta.author)
        rec.author = meta.author;

      if (meta.description[0] &&
          ( !(rec.short_description) || 0 == rec.short_description.indexOf('by') )
      )
        rec.short_description = meta.description[0];

      if (meta.description[1])
        rec.long_description = meta.description[1];

      if (meta.tags)
        rec.tags = meta.tags;

      if (meta.level)
        rec.level = meta.level;

      if (meta.rank)
        rec.rank = meta.rank;
    }
  });

  var theBigString = JSON.stringify({allTheLinks: allLinks, linkCategories: categories}, null, 2);
  fs.writeFile(jsonOutPath, theBigString, function(err){
    if (err)
      console.error('Couldn\'t write' + path.resolve(jsonOutPath));
  });
});
