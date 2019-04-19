const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const articleSchema = new Schema({
  headline: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  saved: {
    type: Boolean,
    default: false
  }
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;