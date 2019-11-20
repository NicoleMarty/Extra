// Dependencies
var express = require("express");
var mongojs = require("mongojs");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var path = require("path");

// Enable scraping
var cheerio = require("cheerio");
var axios = require("axios");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize express
var app = express();

// Configure Middleware
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Database configuration
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
    console.log("Database Error:", error);
});

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/populatedb", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongolab-clean-84739";


// ROUTES
// **********

console.log("\n**************************\n" +
    "Grabbing every articles title, sub-title, meta data, and link \n" +
    "from fashionista.com Fashion Week section:" +
    "\n*******************\n");

// Scrape data from the site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    axios.get("https://fashionista.com/fashion-week").then(function (response) {
        var $ = cheerio.load(response.data);
        $("h2.m-card--header-text").each(function (i, element) {
            var result = {};
            result.content = $(this).text();
            result.link = $(this).children().attr("href");

            //var content = $(element).text();
            //var link = $(element).children().attr("href");
            // If the found elements have the content and link
            //if (content && link) {
            db.Article.create(result).then(function (dbArticle) {
                console.log(dbArticle);
                //content: content,
                //link: "https://fashionista.com" + link,

            })
                .catch(function (error) {
                    console.log(error);
                });

        });
        // Send a "Scrape Complete" message to the browser
        res.send("Scrape Complete");
    });
});
// Main route (Hello Fabulous)
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "./public/index.html"))
});

// Route for retrieving all Notes from the db
app.get("/notes", function (req, res) {
    // Find all Notes
    db.Note.find({}, function (error, dbNote) {
        if (error) {
            console.log(error);
        } else {
            res.json(dbNote);
        }
    })
});

// Route for saving a new Note to the db and associating it with a User
app.post("/submit", function (req, res) {
    // Create a new Note in the db
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, { new: true });
        })
        .then(function (dbArticle) {
            // If the User was updated successfully, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});



// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({}, function (error, dbArticle) {
        if (error) {
            console.log(error);
        }
        else {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        }
    });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate(dbNote)
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create({ _id: req.params.id.body })
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});