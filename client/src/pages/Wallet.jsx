import React, { useState } from 'react';
import { handleError, handleSuccess } from '../components/ErrorMessage';
import { History, Shield, Zap, Percent, Home, MessageSquare, Mic, CreditCard, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUserData } from '../context/UserdataContext';
import useUserStore from '../store/userStore';
import loadRazorpay from '../utils/RazorpayLoder';
import removeRazorpay from '../utils/RazorpayRemove';

const coinPackages = [
    { coins: 25, price: 9, bonus: null, tag: 'BASIC', tagType: 'basic' },
    { coins: 95, price: 29, bonus: null, tag: 'BASIC', tagType: 'basic' },
    { coins: 180, price: 49, bonus: null, tag: 'POPULAR', tagType: 'popular' },
    { coins: 400, price: 99, bonus: null, tag: 'POPULAR', tagType: 'popular' },
    { coins: 880, price: 199, bonus: null, tag: 'BEST VALUE', tagType: 'best' },
    { coins: 2400, price: 499, bonus: '+200 bonus', tag: 'MOST POPULAR', popular: true },
    { coins: 5000, price: 999, bonus: '+500 bonus' },
    { coins: 11000, price: 1999, bonus: '+1500 bonus' },
    { coins: 30000, price: 4999, bonus: '+3500 bonus' },
    { coins: 66000, price: 9999, bonus: '+8000 bonus' },
    { coins: 100000, price: 14999, bonus: '+15000 bonus' },
    { coins: 200000, price: 29999, bonus: '+35000 bonus' },
];

export default function AddaLoveRecharge() {
    // State Management
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { user: useralldata } = useUserStore();
    const [balance, setBalance] = useState(null);
    const naviget = useNavigate();

    const handleclick = () => {
        naviget('/transcation-history');
    };

    // Razorpay Payment Handler
    const handlePayment = async () => {
        setIsProcessing(true);
        const loaded = await loadRazorpay();

        if (!loaded) {
            handleError("Failed to load Razorpay");
            setIsProcessing(false);
            return;
        }
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/creat-coin-order`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount: selectedPkg.price, coins: selectedPkg.coins, bonus: selectedPkg.bonus }),
        });

        const data = await response.json();
        console.log(data);
        if (!data.success) {
            setIsProcessing(false);
            return handleError('Network issue try again!');
        }
        const orderId = data.data.order.id;
        const amount = data.data.order.amount;
        const currency = data.data.order.currency;
        const orderdata = data.data.order.notes;

        const option = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: amount,
            currency: currency,
            name: 'AddaLove💖',
            description: 'Coins buy',
            order_id: orderId,
            callback_url: import.meta.env.VITE_CALLBACK_URL,
            handler: async function (response) {
                const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
                console.log(razorpay_payment_id, razorpay_order_id, razorpay_signature);

                const url2 = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/verify-payment`;
                const responce = await fetch(url2, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ razorpay_payment_id, razorpay_order_id, razorpay_signature }),
                });
                const data2 = await responce.json();
                if (data2.success) {
                    handleSuccess('Payment successful !');
                    console.log(orderdata);
                    let totalbouns;
                    if (orderdata.bonus === '+200 bonus') {
                        totalbouns = 200;
                    } else if (orderdata.bonus === '+500 bonus') {
                        totalbouns = 500;
                    } else if (orderdata.bonus === '+1500 bonus') {
                        totalbouns = 1500;
                    } else if (orderdata.bonus === '+3500 bonus') {
                        totalbouns = 2500;
                    } else if (orderdata.bonus === '+8000 bonus') {
                        totalbouns = 8000;
                    } else if (orderdata.bonus === '+15000 bonus') {
                        totalbouns = 15000;
                    } else if (orderdata.bonus === '+35000 bonus') {
                        totalbouns = 15000;
                    } else {
                        totalbouns = 0;
                    }
                    const url3 = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/add-coin`;
                    const res = await fetch(url3, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: 'include',
                        body: JSON.stringify({ userId: orderdata.userId, coins: orderdata.coins, bonus: totalbouns, razorpay_payment_id, razorpay_order_id, amount: amount })
                    });
                    const data3 = await res.json();
                    console.log(data3);
                    if (data3.success) {
                        setBalance(data3.data.newWlletBlance);
                        setIsProcessing(false);
                        setIsModalOpen(false);
                        setSelectedPkg(null);
                    }
                } else {
                    handleError("Payment fail");
                    setIsProcessing(false);
                }
            },
            prefill: {
                name: `${orderdata.username}`,
                email: `${orderdata.useremail}`,
            },
            theme: {
                color: '#e84393',
            },
        };
        try {
            const rzp = new window.Razorpay(option);
            rzp.open();
        } catch (error) {
            setIsProcessing(false);
            handleError('Payment Cancel');
            console.error('Payment Error:', error);
        } finally {
            removeRazorpay();
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07050a] text-white font-sans selection:bg-pink-500 selection:text-white pb-32">
            <div className="max-w-md mx-auto p-4">

                {/* Header */}
                <header className="flex items-center justify-between mb-5 mt-5">
                    <div className="flex items-center gap-2">
                        {/* Custom App Logo Icon */}
                        <div className="w-8 h-8 rounded-full bg-linear-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold tracking-wide flex items-center">
                            <span className="text-pink-500">Adda</span>
                            <span className="text-pink-400 font-semibold ml-0.5">Love</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 bg-[#171226] border border-[#2d2244] px-3 py-1 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-amber-950">₹</div>
                            <span className="text-white font-bold text-xs tracking-wide">{balance ? balance : (useralldata?.walletBlance || "0")}</span>
                        </div>

                        <button className="w-8 h-8 rounded-full bg-[#171226] border border-[#2d2244] flex items-center justify-center text-gray-300 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                {/* Balance Card Section */}
                <div className="bg-linear-to-br from-[#1b102e] via-[#0f091c] to-[#07050a] border border-[#2c1d45] rounded-2xl p-5 mb-6 relative overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-12 items-center gap-2">
                        <div className="col-span-7">
                            <div className="text-[10px] tracking-widest text-gray-400 font-bold uppercase mb-1">
                                YOUR BALANCE
                            </div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-3.5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-400 tracking-tight">
                                    {balance ? balance : (useralldata?.walletBlance || "8680")}
                                </span>
                                <div className="flex items-center gap-1 text-[#eab308] font-bold text-sm mt-2">
                                    <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[11px] font-black text-amber-950">₹</div>
                                    <span>coins</span>
                                </div>
                            </div>
                            <div className="text-gray-500 text-xs font-medium mb-5">
                                ≈ ₹0.99 value
                            </div>
                        </div>

                        {/* Floating Wallet Illustration Area */}
                        <div className="col-span-5 relative flex justify-center items-center">
                            <div className="absolute w-24 h-24 bg-purple-500/20 rounded-full blur-xl -z-10 animate-pulse"></div>
                            <div className="relative p-3 bg-linear-to-b from-[#2e1d4d] to-[#160d29] rounded-xl border border-[#442c73] shadow-xl rotate-12 transform hover:rotate-0 transition-transform duration-300">
                                <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 p-0.5 rounded-full text-[9px] font-black shadow-md">👑</div>
                                <div className="w-12 h-8 bg-purple-600/40 rounded-md flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-pink-500 opacity-80"></div>
                                </div>
                            </div>
                            {/* Decorative mini ambient coins floating */}
                            <span className="absolute text-[10px] top-0 left-4 animate-bounce">🪙</span>
                            <span className="absolute text-xs bottom-1 right-2 animate-pulse">🪙</span>
                        </div>
                    </div>

                    {/* Transaction History Button Wrapper */}
                    <button 
                        onClick={handleclick} 
                        className="w-full flex items-center justify-between bg-black/40 border border-[#bfa34c]/30 hover:border-[#bfa34c]/60 text-[#ffd56b] transition-all px-4 py-2.5 rounded-xl text-xs font-semibold"
                    >
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-[#ffd56b]" />
                            <span>Your transaction history</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#ffd56b]/70" />
                    </button>
                </div>

                {/* Recharge Section Title */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                        <Zap className="w-5 h-5 text-pink-500 fill-pink-500" />
                        <h2 className="text-lg font-bold tracking-wide text-white">Recharge Coins</h2>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">Choose a pack that suits you</p>
                </div>

                {/* Grid of Coin Packages - Matched to exact 4-column layout */}
                <div className="grid grid-cols-4 gap-2.5 mb-8">
                    {coinPackages.map((pkg, index) => {
                        const isSelected = selectedPkg?.price === pkg.price;

                        return (
                            <div
                                key={index}
                                onClick={() => {
                                    setSelectedPkg(pkg);
                                    setIsModalOpen(true);
                                }}
                                className={`relative bg-[#110d1a] rounded-xl p-2.5 pt-4 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-pink-500 bg-[#22132d] shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                                        : pkg.popular
                                            ? 'border-pink-500 bg-[#170e21]'
                                            : 'border-[#221836] hover:border-gray-700'
                                }`}
                            >
                                {/* Elite Badges matching image spec precisely */}
                                {pkg.popular && (
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-linear-to-r from-pink-500 to-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md">
                                        Most Popular
                                    </div>
                                )}

                                {/* Card Coin Content */}
                                <div className="flex items-center gap-1 mb-1">
                                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-amber-950 shadow-xs">₹</div>
                                    <span className="text-[#facc15] font-extrabold text-[13px] tracking-tight">
                                        {pkg.coins.toLocaleString()}
                                    </span>
                                </div>

                                {/* Custom Sub-Labels Content */}
                                <div className="min-h-[16px] flex items-center justify-center mb-3">
                                    {pkg.tag ? (
                                        <span className={`text-[7px] font-extrabold px-1.5 py-0.5 rounded-sm tracking-wide uppercase ${
                                            pkg.tagType === 'basic' ? 'bg-[#25222e] text-gray-300 border border-gray-600/30' :
                                            pkg.tagType === 'popular' ? 'bg-[#2f183b] text-pink-400 border border-pink-500/20' :
                                            pkg.tagType === 'best' ? 'bg-[#2c2720] text-amber-400 border border-amber-500/20' :
                                            'text-pink-400 font-bold'
                                        }`}>
                                            {pkg.tag}
                                        </span>
                                    ) : pkg.bonus ? (
                                        <span className="text-[#22c55e] font-extrabold text-[8px] tracking-tight">
                                            {pkg.bonus}
                                        </span>
                                    ) : null}
                                </div>

                                {/* Price block layout element */}
                                <div className="w-full pt-1.5 border-t border-gray-800/60 text-center">
                                    <span className="text-white font-extrabold text-[13px]">
                                        ₹{pkg.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Trust/Feature Badges Footnote matching image style precisely */}
                <div className="bg-[#0b0912] border border-[#1a1426] rounded-xl p-3 grid grid-cols-3 gap-1 text-center divide-x divide-gray-900 mb-4">
                    <div className="flex flex-col items-center justify-center px-1">
                        <Shield className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="text-[9px] font-bold text-white block">100% Secure</span>
                        <span className="text-[7px] text-gray-500">Safe & trusted payments</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-1">
                        <Zap className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="text-[9px] font-bold text-white block">Instant Delivery</span>
                        <span className="text-[7px] text-gray-500">Coins added instantly</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-1">
                        <Percent className="w-4 h-4 text-purple-400 mb-1" />
                        <span className="text-[9px] font-bold text-white block">Best Offers</span>
                        <span className="text-[7px] text-gray-500">Extra coins in every pack</span>
                    </div>
                </div>

                {/* Payment Gateway Trust Tagline */}
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-[10px] mb-6">
                    <span>🔒 Securing trusted payment partners</span>
                </div>
            </div>


            {/* Payment Confirmation Overlay Modal Drawer */}
            {isModalOpen && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-[#120e1c] border border-[#2c1d45] rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-fade-in-up">
                        
                        {/* Interactive Drag Pill / Close Accent line */}
                        <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto my-3 sm:hidden" onClick={() => !isProcessing && setIsModalOpen(false)}></div>

                        <button
                            onClick={() => !isProcessing && setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                            disabled={isProcessing}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-5">
                            <h3 className="text-base font-bold mb-4 text-center text-white tracking-wide">Confirm Recharge</h3>

                            <div className="bg-[#0a0710] rounded-xl p-4 border border-[#221836] mb-5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-gray-400">Selected Coins Package</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-amber-950">₹</div>
                                        <span className="text-sm font-bold text-amber-400">{selectedPkg.coins.toLocaleString()}</span>
                                    </div>
                                </div>

                                {selectedPkg.bonus && (
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-gray-400">Bonus Allocation</span>
                                        <span className="text-xs font-bold text-green-500">{selectedPkg.bonus}</span>
                                    </div>
                                )}

                                <div className="h-px w-full bg-gray-900 my-3"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-300 font-medium">Payable Amount</span>
                                    <span className="text-xl font-black text-white tracking-tight">₹{selectedPkg.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 mb-5 text-gray-400 text-[11px]">
                                <Shield className="w-3.5 h-3.5 text-blue-500" />
                                Secured checkout powered by <span className="font-bold text-white tracking-wide">Razorpay</span>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-purple-950 disabled:to-purple-900 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center shadow-lg shadow-pink-500/20 text-sm"
                            >
                                {isProcessing ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    `Pay Now • ₹${selectedPkg.price.toLocaleString()}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation injection styling */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.25s ease-out forwards;
                }
                `
            }} />
        </div>
    );
}