// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Enable scraping
var cheerio = require("cheerio");
var axios = require("axios");

// Initialize express
var app = express();

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
});

// Retrieve data from the db
app.get("/all", function(req, res) {
    // Find all results from the scrapedData collection in the db
    db.fashion.find({}, function(error, found) {
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
        var results = [];
        $("div.l-grid--item").each(function(i, element) {
            var content = $(element).text();
            var link = $(element).children().attr("href");
            // If the found elements have the content and link
            if (content && link) {
                db.fashion.insert({
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