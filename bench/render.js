var path = require('path')
var fs = require('fs-extra')
var arbitraryDeepContent = require('./fixtures/arbitrary-content')
var lambdas = require('./fixtures/lambdas')
var ctx = { lookup: p => p }
var cache = {}

var finish = (name, done) => (err, html) => {
  // One time only, output the html to a file, just in case it needs to be reviewed
  if (!cache[name] && !err && html) {
    cache[name] = html
    fs.outputFile(path.resolve(__dirname, `../reports/generated/${ name }.html`), html, { encoding: 'utf8' }, e => {
      if (e) {
        console.log(e)
      }
      done(err)
    })
  } else {
    done(err)
  }
}
var render = require('../lib/hogan-xpress').bind(ctx)

suite('Render a page', function() {
  test('a basic page with no layout, partials, custom yields, or lambdas', function(done) {
    render(`${ __dirname }/fixtures/basic.html`, {
      settings: {
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A basic page with no layout, partials, custom yields, or lambdas',
      features: [
        {
          name: 'custom yields',
          value: false
        },
        {
          name: 'layout',
          value: false
        },
        {
          name: 'partials',
          value: false
        },
        {
          name: 'lambdas',
          value: false
        }
      ],
      lambdas: lambdas
    }, finish('basic', done))
  })

  test('a page with a layout, but no partials, custom yields, or lambdas', function(done) {
    render(`${ __dirname }/fixtures/with-layout.html`, {
      settings: {
        layout: `${ __dirname }/fixtures/layout.html`,
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A page with a layout, but no partials, custom yields, or lambdas',
      features: [
        {
          name: 'custom yields',
          value: false
        },
        {
          name: 'layout',
          value: true
        },
        {
          name: 'partials',
          value: false
        },
        {
          name: 'lambdas',
          value: false
        }
      ],
      lambdas: lambdas
    }, finish('layout', done))
  })

  test('a page with a layout and partials, but custom yields, or lambdas', function(done) {
    render(`${ __dirname }/fixtures/with-layout-partial.html`, {
      settings: {
        layout: `${ __dirname }/fixtures/layout.html`,
        partials: {
          'list-partial': `${ __dirname }/fixtures/partials/list-partial.html`
        },
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A page with a layout and partials, but custom yields, or lambdas',
      features: [
        {
          name: 'custom yields',
          value: false
        },
        {
          name: 'layout',
          value: true
        },
        {
          name: 'partials',
          value: true
        },
        {
          name: 'lambdas',
          value: false
        }
      ],
      lambdas: lambdas
    }, finish('layout-partial', done))
  })

  test('a page with a layout and partials and custom yields', function(done) {
    render(`${ __dirname }/fixtures/with-layout-partial-yield.html`, {
      settings: {
        layout: `${ __dirname }/fixtures/layout-yield.html`,
        partials: {
          'list-partial': `${ __dirname }/fixtures/partials/list-partial.html`
        },
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A page with a layout and partials and custom yields',
      features: [
        {
          name: 'custom yields',
          value: true
        },
        {
          name: 'layout',
          value: true
        },
        {
          name: 'partials',
          value: true
        },
        {
          name: 'lambdas',
          value: false
        }
      ],
      lambdas: lambdas
    }, finish('layout-partial-yield', done))
  })

  test('a page with a layout, partials, and lambdas', function(done) {
    render(`${ __dirname }/fixtures/with-layout-partial-lambda.html`, {
      settings: {
        layout: `${ __dirname }/fixtures/layout.html`,
        partials: {
          'list-partial-lambda': `${ __dirname }/fixtures/partials/list-partial-lambda.html`
        },
        lambdas: {
          reverse: function(str) {
            return str.split('').reverse().join('')
          }
        },
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A page with a layout, partials, and lambdas',
      features: [
        {
          name: 'custom yields',
          value: false
        },
        {
          name: 'layout',
          value: true
        },
        {
          name: 'partials',
          value: true
        },
        {
          name: 'lambdas',
          value: true
        }
      ],
      lambdas: lambdas
    }, finish('layout-partial-lambda', done))
  })

  test('a page with a layout, partials, custom yields, and lambdas', function(done) {
    render(`${ __dirname }/fixtures/with-layout-partial-yield-lambda.html`, {
      settings: {
        layout: `${ __dirname }/fixtures/layout-yield.html`,
        partials: {
          'list-partial-lambda': `${ __dirname }/fixtures/partials/list-partial-lambda.html`
        },
        lambdas: {
          reverse: function(str) {
            return str.split('').reverse().join('')
          }
        },
        title: 'Default title',
        features: 'Default features',
        deep: arbitraryDeepContent
      },
      title: 'A page with a layout, partials, custom yields, and lambdas',
      features: [
        {
          name: 'custom yields',
          value: true
        },
        {
          name: 'layout',
          value: true
        },
        {
          name: 'partials',
          value: true
        },
        {
          name: 'lambdas',
          value: true
        }
      ],
      lambdas: lambdas
    }, finish('layout-partial-yield-lambda', done))
  })
})
