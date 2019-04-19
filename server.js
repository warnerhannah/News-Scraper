const express = require("express");
const exphbs = require("express-handlebars");
const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 8080;

const db = require("./models");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scarperData";

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true }, (err) => {
        if (err) throw err;
        console.log("Database Connected!");
    });

app.use(express.static("public"));





// ROUTES
app.get("/", (req, res) => {
    db.Article
        .find({})
        .populate("comments")
        .then(dbArticles => {
            // res.json(dbArticles);
            res.render("index", { articles: dbArticles });
        });
});

// SCRAPE
app.get("/scrape", (req, res) => {
    axios.get("https://www.dailynews.com/").then(response => {
        const $ = cheerio.load(response.data);

        $("article h2").each(function (i, element) {
            let headline = $(element).children("a").attr("title");
            let url = $(element).children("a").attr("href");
            const articleResult = {
                headline: headline,
                url: url
            }

            console.log(articleResult)
            db.Article.create(articleResult)
                .then(dbArticle => {
                    console.log(dbArticle);
                })
                .catch(err => {
                    console.log(err);
                });
        });
        res.send("Scrape Complete");
    });
    res.redirect("/")
});

app.post("/api/:articleId/comment", (req, res) => {
    db.Comment
        .create({body: req.body.body})
        .then(dbComment => {
            return db.Article.findOneAndUpdate({_id: req.params.articleId}, {$push: { comments: dbComment._id}}, {new: true})
        })
        .then(() => res.redirect("/"))
        .catch(err => res.json(err));
});

// app.put("/api/:articleId/comment", (req, res) => {
//     db.Comment
//         .remove({_id: req.params.articleId})
//         .then(dbComment => {
//             console.log(dbComment)
//         })
//         .then(() => res.redirect("/"))
//         .catch(err => res.json(err));
// });

app.post("/api/:articleId/comment", (req, res) => {
    db.Comment
        .create({body: req.body.body})
        .then(dbComment => {
            return db.Article.findOneAndUpdate({_id: req.params.articleId}, {$push: { comments: dbComment._id}}, {new: true})
        })
        .then(() => res.redirect("/"))
        .catch(err => res.json(err));
});

app.get("/saved"), (req,res) => {
    res.render("saved")
    // db.Articles 
    // .find({saved: true})
    // .then(dbArticles => {
    //     // res.json(dbArticles);
    //     res.render("saved", { articles: dbArticles });
    // });
}

app.post("api/saved/:articleId"), (req,res) => {
    db.Articles 
    .find({saved: false})
    .then(dbArticles => {
        // res.json(dbArticles);
        return db.Article.findOneAndUpdate({_id: req.params.articleId}, {$set: { saved: true}}, {new: true})
    });
}



app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});