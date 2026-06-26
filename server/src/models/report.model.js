import { Schema, model } from "mongoose";

const reportSchema = new Schema({
    reportedBy: {
        type: Schema.Types.ObjectId,
        refPath: "userModel",
        required: true
    },
    reportedUser: {
        type: Schema.Types.ObjectId,
        refPath: "userModel",
        required: true
    },
    userModel: {
        type: String,
        enum: ["User", "Girls"],
        required: true
    },
    reason: {
        type: String,
        required: true
    }
},{timestamps: true});

const Report = model("Report", reportSchema);

export default Report;