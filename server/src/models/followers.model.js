import mongoose from "mongoose";

const followersSchema = new mongoose.Schema({
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },{timestamps: true});

followersSchema.index({ follower: 1, following: 1 }, { unique: true });

const Followers = mongoose.model("Followers", followersSchema);

export default Followers;