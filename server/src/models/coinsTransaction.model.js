import mongoose, { model } from "mongoose"

const coinsTransacationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coins: {
        type: Number,
        required: true
    },
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_order_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },

}, { timestamps: true });

const CoinTransaction = mongoose.model('CoinTransaction', coinsTransacationSchema);
export default CoinTransaction;