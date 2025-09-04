const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    tableNo: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
