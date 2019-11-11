// We'll be rewriting the table's data frequently, so let's make our code more DRY
// by writing a function that takes in 'animals' (JSON) and creates a table body
function displayResults(scrapedData) {
    // First, empty the table
    $("tbody").empty();

    // Then, for each entry of that json...
    fashion.forEach(function(content) {
        // Append each of the animal's properties to the table
        var tr = $("<tr>").append(
            $("<td>").text(content.content),
            $("<td>").text(content.link)
        );

        $("tbody").append(tr);
    });
}

// First thing: ask the back end for json with all animals
$.getJSON("/scrape", function(data) {
    // Call our function to generate a table body
    displayResults(data);
});