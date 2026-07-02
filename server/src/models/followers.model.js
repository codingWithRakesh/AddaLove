import mongoose from "mongoose";
const followersSchema = new mongoose.Schema({
  followerModel: {
    type: String,
    enum: ["User", "Girls"],
    required: true
  },
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'followerModel'
  },
  followingModel: {
    type: String,
    enum: ["User", "Girls"],
    required: true
  },

  following: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'followingModel'
  },
}, { timestamps: true });
followersSchema.index(
  {
    follower: 1,
    followerModel: 1,
    following: 1,
    followingModel: 1
  },
  { unique: true }
);


const Followers = mongoose.model("Followers", followersSchema);

export default Followers;