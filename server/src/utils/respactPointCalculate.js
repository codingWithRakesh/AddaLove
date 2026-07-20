import Rating from "../models/rating.model.js";

const respactPointCalculate = async (userId) => {
    let sum = 0;
    if (!userId) {
        return null;
    }
    const allPoint = await Rating.find({ ratedUser: userId }).select('rating').lean();
    if (allPoint.length == 0) {
        return null;
    }
    for (let i = 0; i < allPoint.length; i++) {
        sum = sum + allPoint[i]
    }
    return sum;

}
export {respactPointCalculate};