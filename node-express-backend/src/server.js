import express from "express";
import path from "path";
import fs from "fs";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import multer from "multer";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import bodyParser from "body-parser";
import Info from "./customerSchema.js";
dotenv.config();

const jsonParser = bodyParser.json();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname);

const app = express();
const port = 8000;
//here is a change
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../build")));

app.use(express.static(path.join(__dirname, "../posters")));
//app.use(express.static("posters"));

const upload = multer({ dest: "posters/" });

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

/*const movieData = JSON.parse(fs.readFileSync('./movies.json'));
console.log(movieData);
/*let movieData = [
    {"title":"Terminator 2"},
    {"title":"Rocky IV"},
    {"title":"Titanic"},
    {"title":"Die Hard"}
];*/

app.get("/api/movies", async (req, res) => {
  //res.json(movieData)
  try {
    await mongoose.connect(process.env.MONGO_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = mongoose.connection;
    const movieData = await db.collection("reviews").find({}).toArray();
    console.log(movieData);
    res.json(movieData);
    res.status(200);
  } catch (error) {
    res.status(206).json({ message: error.message });
  }
});

app.post("/api/removeMovie", async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = mongoose.connection;

    const result = await db
      .collection("reviews")
      .deleteOne({ title: req.body.title });

    res.status(200);
  } catch (error) {
    res.status(206).json({ message: error.message });
  }
});

app.post("/api/overwrite", jsonParser, async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = mongoose.connection;

    //console.log(req.body);
    /*for( let index in req.body ) {
      console.log(req.body[index].title + " " + req.body[index].poster);
    }*/

    const deleteResult = await db.collection("reviews").deleteMany({});
    console.log("Deleted documents =>", deleteResult);

    const insertResult = await db.collection("reviews").insertMany(req.body);
    console.log("Inserted documents =>", insertResult);

    res.status(200);
  } catch (error) {
    res.status(206).json({ message: error.message });
  }
});

app.post("/api/review", upload.single("movie_poster"), async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGO_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = mongoose.connection;

    const insertOperation = await db
      .collection("reviews")
      .insertOne({ title: req.body.title, poster: req.file.filename });
    console.log(insertOperation);
    res.status(200);
    res.redirect("/");
  } catch (error) {
    res.status(206).json({ message: error.message });
  }

  /*movieData.push( { "title":req.body.title })
    saveData();
    console.log("update movies called");
    console.log(req.body);
    res.redirect('/');*/
});

app.post("/api/addInfo", async (req, res) => {
  try {
    const info = new Info({
      name: "brady",
      movie: "movie1",
    });

    const newInfo = await info.save();
    res.status(200).json(newInfo);
  } catch (error) {
    res.status(206).json({ message: error.message });
  }
});

const saveData = () => {
  const jsonContent = JSON.stringify(movieData);
  fs.writeFile("./movies.json", jsonContent, "utf8", function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
    }
    console.log("JSON file has been saved.");
  });
};

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
