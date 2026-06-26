import {Schema, model} from "mongoose";

const ratingSchema = new Schema({
    ratedBy: {
        type: Schema.Types.ObjectId,
        refPath: "userModel",
        required: true
    },
    ratedUser: {
        type: Schema.Types.ObjectId,
        refPath: "userModel",
        required: true
    },
    userModel: {
        type: String,
        enum: ["User", "Girls"],
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, {timestamps: true});

const Rating = model("Rating", ratingSchema);

export default Rating;