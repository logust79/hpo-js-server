// entry point
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const HpoMongo = require("./models/hpo");
const HpoClass = require("./lib/Hpo");

// connect to db
const dbRoute = process.env.MONGODB_URL;
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));
// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format

const app = express();

// initiate Hpo
const Hpo = new HpoClass(HpoMongo);

app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-auth"
  );
  res.header("Access-Control-Expose-Headers", "x-auth");
  next();
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/hpo/:id", (req, res) => {
  const { id } = req.params;
  HpoMongo.findOne({ id }, (_, data) => {
    return res.json({ success: true, data: data });
  }).catch(e => {
    console.log(e);
  });
});

app.get("/hpoName/:id", (req, res) => {
  const { id } = req.params;
  HpoMongo.findOne({ id }, (_, data) => {
    return res.json({ success: true, data: data.name });
  });
});

app.get("/hpoNames/:ids", (req, res) => {
  const ids = req.params.ids.split(",");
  HpoMongo.find({ id: { $in: ids } }, (_, response) => {
    let data = {};
    response.map(e => {
      data[e.id] = e.name;
    });
    return res.json({ success: true, data });
  });
});

app.get("/hpoAncestors/:id", (req, res) => {
  const { id } = req.params;
  Hpo.getAncestors(id, []).then(data => {
    return res.json({ success: true, data });
  });
});

app.get("/hpoMinGraph/:hpoList", (req, res) => {
  const hpoList = req.params.hpoList.split(",");
  Hpo.getMinGraph(hpoList)
    .then(data => {
      return res.json({ success: true, data });
    })
    .catch(error => {
      console.log(error);
      return res.json({ success: false, error });
    });
});

app.listen(process.env.PORT || 8080);
