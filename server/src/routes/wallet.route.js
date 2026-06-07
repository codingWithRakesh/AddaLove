import express from 'express';
import { addMoneyToWallet, coinTranscationHistory, creatCoinOrder, paymentVerify } from '../controllers/wallet.controller.js';
import { verifyUser } from '../middlewares/user.middleware.js';
const WalletRoute= express.Router();

WalletRoute.post('/creat-coin-order',verifyUser,creatCoinOrder);
WalletRoute.post('/verify-payment',verifyUser,paymentVerify);
WalletRoute.post('/add-coin',verifyUser,addMoneyToWallet);
WalletRoute.get('/transcatin-history',verifyUser, coinTranscationHistory);

export default WalletRoute;