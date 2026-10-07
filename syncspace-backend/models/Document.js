const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true,
    },

    content: {
      type: String,
      default: "",
    },

    yjsState: {
      type: Buffer,
      default: null,
    },

    language: {
      type: String,
      default: "javascript",
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);