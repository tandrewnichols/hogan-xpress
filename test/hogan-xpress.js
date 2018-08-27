var request = require('supertest');
var cheerio = require('cheerio');
var app = request( require('./fixtures/app') );
var expect = require('expect.js');

describe('hogan-xpress', function() {
  var $;
  var get = function(where, done) {
    app.get(where).end(function(err, res) {
      if (err) {
        console.error('Error:', err);
        done(err);
      } else {
        $ = cheerio.load(res.text);
        done();
      }
    });
  };

  describe('basic page', function() {
    // render and parse page
    before(function(done) {
      get('/', done);
    });

    it('should have a body', function() {
      expect($('body').length).to.be(1);
    });

    it('should have a h1 = Test', function() {
      expect($('h1').text()).to.be('Test');
    });

    it('should be able to handle lambdas (reverse)', function() {
      expect($('[rel="test-reverse-lambda"]').text().trim()).to.be('dlroW');
    });

    it('should be able to handle lambdas within arrays (reverse)', function() {
      expect($('[rel="test-reverse-lambda-with-context"] tr:first-child th').text().trim()).to.be('tsrif');
    });

    it('should be able to handle lambdas within arrays (reverse) - including "locals" data', function() {
      expect($('[rel="test-reverse-lambda-with-context"] tr:nth-child(1) td').text().trim()).to.be('atad motsuc');
      expect($('[rel="test-reverse-lambda-with-context"] tr:nth-child(2) td').text().trim()).to.be('atad tluafed');
    });

    it('should be able to have more than one lambda defined', function() {
      expect($('[rel="test-uppercase-lambda"]').text().trim()).to.be('WORLD');
    });

    it('should be able to have nested lambdas', function() {
      expect($('[rel="test-nested-lambdas"]').text().trim()).to.be('DLROW');
    });

  });

  describe('page with no layout', function() {
    before(function(done) {
      get('/nolayout', done);
    });

    it('should have a body', function() {
      expect($('body').length).to.be(1);
    });

    it('should have h1 equal to foo', function() {
      expect($('body h1').text()).to.be('Foo');
    });

    it('should not have a title', function() {
      expect($('title').length).to.be(0);
    });
  });
});
