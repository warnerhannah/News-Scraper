// GENERAL DECLARATION
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

// CONNECT TO MONGO DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scarperData";

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true }, (err) => {
        if (err) throw err;
        console.log("Database Connected!");
    });

app.use(express.static("public"));


// ROUTES
// HOME PAGE, SHOW ARTICLES AND COMMENTS IF ANY
app.get("/", (req, res) => {
    db.Article
        .find({saved: false})
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

// ADD A COMMENT
app.post("/api/:articleId/comment", (req, res) => {
    db.Comment
        .create({ body: req.body.body })
        .then(dbComment => {
            return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $push: { comments: dbComment._id } }, { new: true })
        })
        .then(() => res.redirect("/"))
        .catch(err => res.json(err));
});

// DELETE A COMMENT
// app.post("/api/:articleId/comment", (req, res) => {
//     db.Comment
//         .create({ body: req.body.body })
//         .then(dbComment => {
//             return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $push: { comments: dbComment._id } }, { new: true })
//         })
//         .then(() => res.redirect("/"))
//         .catch(err => res.json(err));
// });

// ADD COMMENTS ON HOME 
app.post("/api/:articleId/comment", (req, res) => {
    db.Comment
        .create({ body: req.body.body })
        .then(dbComment => {
            return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $push: { comments: dbComment._id } }, { new: true })
        })
        .then(() => res.redirect("/"))
        .catch(err => res.json(err));
});

// ADD COMMENTS ON SAVED
app.post("/api/:articleId/comments", (req, res) => {
    db.Comment
        .create({ body: req.body.body })
        .then(dbComment => {
            return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $push: { comments: dbComment._id } }, { new: true })
        })
        .then(() => res.redirect("/saved"))
        .catch(err => res.json(err));
});

//DELETE COMMENT ON HOME 
app.post("/api/:articleId/deleted", (req, res) => {
    db.Comment
        .find({})
        .then(dbComment => {
            return db.Comment.remove({ _id: req.params.articleId })
        })
        .then(res.redirect("/"))
        .catch(err => res.json(err));
});

//DELETE COMMENT ON SAVED 
app.post("/api/:articleId/delete", (req, res) => {
    db.Comment
        .find({})
        .then(dbComment => {
            return db.Comment.remove({ _id: req.params.articleId })
        })
        .then(res.redirect("/saved"))
        .catch(err => res.json(err));
});

// DISPLAY SAVED ARTICLES
app.get("/saved", (req, res) => {
    db.Article
        .find({ saved: true })
        .populate("comments")
        .then(dbArticles => {
            res.render("saved", { articles: dbArticles });
        });
})

// SAVE A NEW ARTICLE
app.post("/api/:articleId/saved", (req, res) => {
    db.Article
        .find({})
        .then(dbComment => {
            return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $set: { saved: true } })
        })
        .then(() => res.redirect("/saved"))
        .catch(err => res.json(err));
});

// DELETE FROM SAVED
app.post("/api/:articleId/unsave", (req, res) => {
    db.Article
        .find({})
        .then(dbArticle => {
            return db.Article.findOneAndUpdate({ _id: req.params.articleId }, { $set: { saved: false } })
        })
        .then(() => res.redirect("/saved"))
        .catch(err => res.json(err));
});

// CLEAR ARTICLES
app.get("/clear", (req, res) => {
    res.render("index");
});


app.listen(PORT, () => {
    console.log(`App running on port http://localhost:${PORT}`);
});