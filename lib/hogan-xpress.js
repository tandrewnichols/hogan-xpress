var fs = require('fs');
var p = require('path');
var hogan = require('hogan.js');

var cache = {};
var ctx = {};
var bytemark = /^\uFEFF/;
var yieldPattern = /({{#yield-\w+}})/g;
var tagPattern = /{{#([\w-]+)}}/;

/*
 * While this looks like it could be cleaned up a lot,
 * please don't. Rigorous experimentation has shown this
 * to be the fastest possible shallow extend that can still
 * return a "new" object.
 */
var extendClone = function(dest, src) {
  var out = {};

  var srcKeys = Object.keys(src);
  var srci = srcKeys.length;

  while (srci--) {
    var key = srcKeys[srci];
    out[key] = src[key] || dest[key];
  }

  // You would think that doing this second loop ONLY when
  // newObj = true would be faster, but it is CONSISTENTLY
  // 11% slower with a layout, but no partials, custom yields,
  // or lambdas, and equal in speed in all other test cases.
  var destKeys = Object.keys(dest);
  var desti = destKeys.length;

  while (desti--) {
    var key = destKeys[desti];
    out[key] = out[key] || dest[key];
  }

  return out;
};

var extend = function(dest, src) {
  var keys = Object.keys(src);
  var i = keys.length;
  while (i--) {
    var k = keys[i];
    dest[k] = src[k];
  }

  return dest;
};

var read = function(path, options, fn) {
  var str = cache[path];

  if (options.cache && str) {
    return fn(null, str);
  }

  fs.readFile(path, 'utf8', function(err, str) {
    if (err) {
      return fn(err);
    }

    str = str.replace(bytemark, '');

    if (options.cache) {
      cache[path] = str;
    }

    return fn(null, str);
  });
};

var renderPartials = function(partials, opt, fn) {
  var count = 1;
  var result = {};

  var handlePath = function(name, path) {
    return function(err, str) {
      if (!count) {
        return;
      }

      if (err) {
        count = 0;
        fn(err);
      }

      result[name] = str;
      if (!--count) {
        return fn(null, result);
      }
    };
  };

  for (var name in partials) {
    var path = partials[name];
    if (typeof path !== 'string') {
      continue;
    }

    if (!p.extname(path)) {
      path += ctx.ext;
    }

    path = ctx.lookup(path);
    count++;
    read(path, opt, handlePath(name, path));
  }

  if (!--count) {
    return fn(null, result);
  }
};

var renderLayout = function(path, opt, fn) {
  if (!path) {
    return fn(null, false);
  }

  if (!p.extname(path)) {
    path += ctx.ext;
  }

  path = ctx.lookup(path);

  if (!path) {
    return fn(null, false);
  }

  read(path, opt, function(err, str) {
    if (err) {
      return fn(err);
    }

    return fn(null, str);
  });
};

var customContent = function(str, tag, opt, partials) {
  var oTag = `{{#${ tag }}}`;
  var cTag = `{{/${ tag }}}`;
  var text = str.substring(str.indexOf(oTag) + oTag.length, str.indexOf(cTag));
  return hogan.compile(text, opt).render(opt, partials);
};

var render = function(path, opt, fn) {
  ctx = this;
  var partials = opt.settings.partials || {};

  if (opt.partials) {
    partials = extend(partials, opt.partials);
  }

  var lambdas = opt.settings.lambdas || {};

  if (opt.lambdas) {
    lambdas = extend(lambdas, opt.lambdas);
  }

  // create the lambdafied functions
  // this way of dealing with lambdas assumes you'll want
  // to call your function on the rendered content instead
  // of the original template string
  opt.lambdas = {};

  var handleLambda = function(name, lambda) {
    opt.lambdas[name] = function() {
      var lambdaContext = this;
      return function(text) {
        if (!lambdaContext.lambdaVals) {
          lambdaContext.lambdaVals = {};
        }

        if (!lambdaContext.lambdaVals[name]) {
          lambdaContext.lambdaVals[name] = {};
        }

        // Extend the parent context with local context so that walking
        // up the context chain works inside lambdas.
        // parse(stringify()) appears to be the most efficient way to clone
        // and object so as not to pollute the parent context.
        var lctx = extendClone(opt, lambdaContext);
        return lambda(hogan.compile(text).render(lctx), lctx);
      };
    };
  };

  for (var name in lambdas) {
    handleLambda(name, lambdas[name]);
  }

  renderPartials(partials, opt, function(err, partials) {
    if (err) {
      return fn(err);
    }

    /* eslint eqeqeq: 0 */
    var layout = opt.layout == void 0 ? opt.settings.layout : opt.layout;
    renderLayout(layout, opt, function(err, layout) {
      read(path, opt, function(err, str) {
        if (err) {
          return fn(err);
        }
        try {
          var tmpl = hogan.compile(str, opt);
          var result = tmpl.render(opt, partials);
          var customTags = str.match(yieldPattern);
          var yields = {};
          if (customTags) {
            customTags.forEach(function(customTag) {
              var tag = customTag.match(tagPattern)[1];
              if (tag) {
                if (layout) {
                  opt[tag] = customContent(str, tag, opt, partials);
                } else {
                  yields[tag.replace('yield-', '')] = customContent(str, tag, opt, partials);
                }
              }
            });
          }

          if (layout) {
            opt.yield = result;
            tmpl = hogan.compile(layout, opt);
            result = tmpl.render(opt, partials);
            return fn(null, result);
          }

          return fn(null, result, yields);
        } catch (err) {
          return fn(err);
        }
      });
    });
  });
};

module.exports = render;
