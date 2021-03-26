var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var pug = require('pug');
var mongoose = require('mongoose');
var shortid = require('shortid');

app.set('view engine', 'pug');
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({ secret: "Your secret key" }));

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.once("open", function() {
  console.log("MongoDB database connection established successfully");
});

// Schema del prodotto
var prodottoSchema = mongoose.Schema({
  id: String,
  sezione: String,
  marca: String,
  nome: String
});
var Prodotto = mongoose.model("Prodotto", prodottoSchema);

// Renderizza la pagina Home
app.get('/', (req, res) => {
  res.render("home");
});

// Renderizza la pagina per inserire un nuovo prodotto
app.get('/new', (req, res) => {
  res.render("new");
});

// Inserisce un nuovo prodotto dalla pagina new
app.post('/new', (req, res) => {
  var prod = req.body;

  if (!prod.sezione || !prod.marca || !prod.nome) {
    res.render('show_message', {
      message: "Compilare tutti i campi", type: "error"
    });
  } else {
    var newId = shortid.generate();
    var newProd = new Prodotto({
      id: newId,
      sezione: prod.sezione,
      marca: prod.marca,
      nome: prod.nome
    });
    newProd.save(function(err, Prodotto) {
      if (err)
        res.render('show_message', { message: "Errore database", type: "error" });
      else
        res.render('show_message', {
          type: "success", prodotto: prod, ide: newId
        });
    });
  }
});

// Ritorna alla Home dalla pagina show_message
app.post('/show_message', (req, res) => {
  res.render("home");
});

// Restituisce tutti i prodotti presenti nel database nella pagina all
app.get('/all', (req, res) => {
  Prodotto.find((err, response) => {
    if (err) {
      res.render('show_message', {
        message: "Database vuoto!", type: "error"
      });
    } else {
      res.render("all", { data: response });
    }
  });
});

// Torna alla Home dalla pagina all
app.post('/all', (req, res) => {
  res.render("home");
});

// Renderizza la pagina find
app.get('/find', (req, res) => {
  res.render("find");
});

// Esegue una ricerca del prodotto nella pagina find e lo visualizza
app.post('/find', (req, res) => {
  var cercaPer = req.body.cercaSelect;
  var daCercare = req.body.valoreFind;

  if (!daCercare) {
    res.render('show_message', {
      message: "Valore inserito non valido", type: "error"
    });
  } else {
    if (cercaPer == "sezione") {
      Prodotto.find({ sezione: daCercare }, (err, response) => {
        if (response == "") {
          res.render('show_message', {
            message: "Valore non trovato!", type: "error"
          });
        }
        if (err) {
          res.send(err);
        } else {
          res.render('all', { data: response });
        }
      });
    } else {
      Prodotto.find({ marca: daCercare }, (err, response) => {
        if (response == "") {
          res.render('show_message', {
            message: "Valore non trovato!", type: "error"
          });
        }
        if (err) {
          res.send(err);
        } else {
          res.render('all', { data: response });
        }
      });
    }
  }
});

// Renderizza la pagina delete
app.get('/delete', (req, res) => {
  res.render("delete");
});

// Cerca l'elemento da eliminare 
app.post('/delete', (req, res) => {
  var daEliminare = req.body.valoreDelete;
  if (!daEliminare) {
    res.render('show_message', {
      message: "Valore inserito non valido", type: "error"
    });
  } else {
    Prodotto.find({ id: daEliminare }, (err, response) => {
      if (response == "") {
        res.render('show_message', {
          message: "Valore non trovato!", type: "error"
        });
      }
      if (err) {
        res.send(err);
      } else {
        res.render('deleteFind', { dataDel: response });
      }
    });
  }
});

// Visualizza l'elemento da eliminare e chiede conferma per l'eliminazione
app.post('/deleteFind', (req, res) => {
  var item = req.body.input;
  var alt = JSON.stringify(req.body);

  if (alt.includes("btnElimina")) {
    Prodotto.deleteOne({ id: item }, (err, response) => {
      if (err) {
        res.render('show_message', {
          message: "Valore inserito non valido", type: "error"
        });
      } else {
        res.render('show_message', {
          message: "Eliminato correttamente!", type: "error"
        });
      }
    });
  } else {
    res.render("home");
  }
});

app.listen(3000, () => {
  console.log("Server running on localhost 3000");
});