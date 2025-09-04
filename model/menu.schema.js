const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false, // Not strictly required
  },
  imagepath: {
    type: String,
    required: false, // Not strictly required
  },
}, {
  // Custom validation to ensure at least one of image or imagepath is provided
  validate: {
    validator: function (v) {
      return !!(this.image || this.imagepath); // Returns true if at least one exists
    },
    message: "At least one of 'image' or 'imagepath' is required.",
  },
});

const MenuDB = mongoose.model("Menu", menuSchema);
module.exports = MenuDB;