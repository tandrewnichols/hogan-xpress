const fs = require('fs');
const path = require('path');
const hogan = require('hogan.js');

const cache = {};
const bytemark = /^\uFEFF/;
const yieldPattern = /({{#yield-\w+}})/g;
const tagPattern = /{{#([\w-]+)}}/;

const extend = (dest, src) => {
  const keys = Object.keys(src);
  let i = keys.length;
  while (i--) {
    const k = keys[i];
    dest[k] = src[k];
  }

  return dest;
};

const defaults = (dest, src) => {
  const keys = Object.keys(src);
  let i = keys.length;

  while (i--) {
    const k = keys[i];
    dest[k] = k in dest && typeof dest[k] !== 'undefined' ? dest[k] : src[k];
  }

  return dest;
};

const coalesce = (thing, config) => {
  let things = config.settings[ thing ] || {};

  if (config[ thing ]) {
    things = extend(things, config[ thing ]);
  }

  return things;
};

const buildLambdas = (lambdas, config) => {
  return Object.keys(lambdas).reduce((memo, name) => {
    let lambda = lambdas[name];
    memo[ name ] = function() {
      return (text) => {
        let context = defaults(extend({}, this), config);
        return lambda(hogan.compile(text).render(context), context);
      };
    };

    return memo;
  }, {});
};

const read = (file, config, context) => {
  return new Promise((resolve, reject) => {
    if (typeof file !== 'string') {
      resolve(null);
    }

    if (!path.extname(file)) {
      file = `${ file }${ context.ext }`;
    }

    file = context.lookup(file);

    let contents = cache[ file ];

    if (config.cache && contents) {
      return resolve(contents);
    }

    fs.readFile(file, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }

      contents = contents.replace(bytemark, ' ');
      if (config.cache) {
        cache[ file ] = contents;
      }

      return resolve(contents);
    });
  });
};

const renderPartials = (partials, config, context) => {
  let results = {};

  let promises = Object.keys(partials).reduce((memo, name) => {
    let file = partials[ name ];
    memo.push(
      read(file, config, context).then((contents) => {
        if (contents) {
          results[ name ] = contents;
        }
      })
    );
    return memo;
  }, []);

  return Promise.all(promises.filter(Boolean)).then(() => {
    return results;
  });
};

const customContent = function(str, tag, config, partials) {
  const open = `{{#${ tag }}}`;
  const close = `{{/${ tag }}}`;
  const text = str.substring(str.indexOf(open) + open.length, str.indexOf(close));
  return hogan.compile(text, config).render(config, partials);
};

const generateTemplate = (config) => {
  return (([ partials, layout, template ]) => {
    try {
      let rendered = hogan.compile(template, config).render(config, partials);
      let customTags = template.match(yieldPattern);
      let yields = {};
      if (customTags) {
        customTags.forEach((customTag) => {
          let tag = customTag.match(tagPattern)[1];
          if (tag) {
            if (layout) {
              config[ tag ] = customContent(template, tag, config, partials);
            } else {
              yields[ tag.replace('yield-', '') ] = customContent(template, tag, config, partials);
            }
          }
        });
      }

      if (layout) {
        config.yield = rendered;
        return hogan.compile(layout, config).render(config, partials);
      } else {
        return rendered;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  });
};

module.exports = function(template, config, fn) {
  const context = this;
  let partials = coalesce('partials', config);
  let lambdas = coalesce('lambdas', config);
  /* eslint eqeqeq: 0 */
  let layout = config.layout == void 0 ? config.settings.layout : config.layout;
  config.lambdas = buildLambdas(lambdas, config);

  Promise.all([
    Object.keys(partials).length ? renderPartials(partials, config, context) : null,
    layout ? read(layout, config, context) : null,
    read(template, config, context)
  ])
    .then(generateTemplate(config))
    .then((res) => {
      fn(null, res);
    }, fn);
};
