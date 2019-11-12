require("dotenv").config();
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

//var db = require("./models");


// Initialize express
var app = express();
var PORT = process.env.PORT || 3000;

// Middleware
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

// Handlebars
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    })
);
app.set("view engine", "handlebars");

// Routes
//require("./routes/apiRoutes")(app);
//require("./routes/htmlRoutes")(app);



// Database configuration
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
    console.log("Database Error:", error);
});

// Main route (Hello Fabulous)
app.get("/", function(req, res) {
    res.send("Hello Fabulous");
    res.sendFile(path.join(__dirname + "./public/index.html"));


});

// Retrieve data from the db
app.get("/all", function(req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function(error, found) {
        // Throw any errors to console
        if (error) {
            console.log(error);
        }
        // If no errors, send data to browser as json
        else {
            res.json(found);
        }
    });
});

console.log("\n**************************\n" +
    "Grabbing every articles title, sub-title, meta data, and link \n" +
    "from fashionista.com Fashion Week section:" +
    "\n*******************\n");

// Scrape data from the site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    axios.get("https://fashionista.com/fashion-week").then(function(response) {
        var $ = cheerio.load(response.data);
        $("div.l-grid--item").each(function(i, element) {
            var content = $(element).text();
            var link = $(element).children().attr("href");
            // If the found elements have the content and link
            if (content && link) {
                db.scrapedData.insert({
                        content: content,
                        link: "https://fashionista.com" + link,

                    },
                    function(error, inserted) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(inserted);
                        }
                    })
            }
        });
    });
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");

});


// Listen on port 3000
app.listen(3000, function() {
    console.log("App running on port 3000!");
});