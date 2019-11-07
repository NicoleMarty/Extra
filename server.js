// Dependencies
var cheerio = require("cheerio");
var axios = require("axios");

console.log("\n**************************\n" +
    "Grabbing every articles title, sub-title, meta data, and link \n" +
    "from fashionista.com Fashion Week section:" +
    "\n*******************\n");

axios.get("https://fashionista.com/fashion-week").then(function(response) {
    var $ = cheerio.load(response.data);
    var results = [];
    $("div.m-card--content").each(function(i, element) {
        var content = $(element).text();
        $("phoenix-super-link").each(function(i, element) {
            var link = $(element).attr("href");

            results.push({
                content: content,
                link: link
            });
        });
    });

    console.log(results);
})