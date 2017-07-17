var fs = require('fs');
var p = require('path');
var hogan = require('hogan.js');

var cache = {}
var ctx = {}

var isObj = function(obj) {
  return obj && obj.toString && obj.toString() == '[object Object]';
};

var extend = function(dest, ...srcs) {
  return srcs.reduce(function(memo, src) {
    for (var k in src) {
      if (!src.hasOwnProperty(k)) {
        continue;
      }
      if (isObj(src[k])) {
        memo[k] = extend({}, src[k]);
      } else {
        memo[k] = src[k];
      }
    }

    return memo;
  }, dest);
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

    str = str.replace(/^\uFEFF/, '');

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
        return fn(null, result)
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
  ctx = this
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
  var lambdaIndexes = {};

  var handleLambda = function(name, lambda) {
    lambdaIndexes[name] = 0;
    opt.lambdas[name] = function() {
      var lambdaContext = this;
      return function(text) {
        if (!lambdaContext.lambdaVals) {
          lambdaContext.lambdaVals = {};
        }

        if (!lambdaContext.lambdaVals[name]) {
          lambdaContext.lambdaVals[name] = {};
        }

        // getting the context right here is important
        // it must account for "locals" and values in the current context
        //  ... particually interesting when applying within a list
        var lctx = extend({}, opt, opt._locals || {}, lambdaContext);
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

    var layout = opt.layout || opt.settings.layout;
    renderLayout(layout, opt, function(err, layout) {
      read(path, opt, function(err, str) {
        if (err) {
          return fn(err);
        }
        try {
          var tmpl = hogan.compile(str, opt);
          var result = tmpl.render(opt, partials);
          var customTags = str.match(/({{#yield-\w+}})/g);
          var yields = {};
          if (customTags) {
            customTags.forEach(function(customTag) {
              var tag = customTag.match(/{{#([\w-]+)}}/)[1];
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
