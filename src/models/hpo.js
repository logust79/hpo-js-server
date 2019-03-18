const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure
const HpoSchema = new Schema(
  {
    id: String,
    name: String,
    alt_id: [String],
    def: String,
    is_a: [String],
    comment: String
  },
  { collection: "hpo" }
);

// export
module.exports = mongoose.model("hpo", HpoSchema);
