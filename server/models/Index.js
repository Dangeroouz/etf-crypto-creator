import mongoose from "mongoose";

const indexSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    selected: [
      {
        type: String,
        required: true,
      },
    ],
    weights: [
      {
        type: Number,
        required: true,
      },
    ],
    initialInvestment: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Index", indexSchema);
