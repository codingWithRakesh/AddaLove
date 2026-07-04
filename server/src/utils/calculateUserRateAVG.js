import Rating from "../models/rating.model.js";

const userRateCalculate=async(userId)=>{
    let sum=0;
    let avg=0;
  if(!userId){
    return null;
  }
   console.log(userId)
   const allRate= await Rating.find({ratedUser:userId}).select('rating').lean()
   if(allRate.length==0){
    return null;
   }
   for(let i=0;i<allRate.length;i++){
    sum=sum+allRate[i].rating;
   }
   avg=sum/allRate.length;
   
   return avg;
} 

export {userRateCalculate};