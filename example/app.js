express = require('express');

app = module.exports = express();

app.set('view engine', 'html');
app.set('layout', 'layout');
app.set('partials', { head: "head" });

// app.enable('view cache')

app.engine('html', require('../hogan-express'));
app.set('views', __dirname + '/views');

app.use(express.bodyParser());
app.use(app.router);

app.get('/', function(req,res) {
  res.locals = { what: 'World' };

  res.locals.data = "default data"

  res.render("index", {
    list: [
      { title: "first", data: "custom data" },
      { title: "Second" },
      { title: "third" }
    ],
    partials: { temp: 'temp' },
    lambdas: {
      reverseString: function(text) {
        return text.split("").reverse().join("");
      },
      uppercase: function(text) {
        return text.toUpperCase();
      }
    }
  });
});

app.listen(4020);
