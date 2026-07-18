import React, { useState } from 'react';
import { handleError, handleSuccess } from '../components/ErrorMessage';
import { 
    History, 
    Shield, 
    Zap, 
    Percent, 
    ChevronRight, 
    X,
    Globe,
    ChevronDown,
    Sparkles,
    Coins,
    Crown
} from 'lucide-react';
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
                color: '#FF2994', // Updated to match new brand color
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
        <div className="min-h-screen bg-[#0A0014] text-slate-100 flex flex-col items-center py-6 px-4 font-sans relative overflow-x-hidden pb-32">
            
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
                <div className="absolute top-[10%] w-[500px] h-[500px] bg-[#FF2994] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
                <div className="absolute bottom-[-10%] w-[400px] h-[400px] bg-[#8B2BFF] rounded-full mix-blend-screen filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md mx-auto z-10">
                
                {/* Header Section */}
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Adda<span className="text-[#FF2994]">Love</span>
                        </h1>
                        <p className="text-[10px] text-slate-300 mt-0.5">Top-up your <span className="text-[#FF2994]">Wallet</span></p>
                    </div>
                    
                    {/* Compact Balance Badge */}
                    <div className="flex items-center gap-2 bg-[#1C1035] border border-[#8B2BFF]/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(139,43,255,0.2)]">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-bold text-sm tracking-wide">
                            {balance ? balance : (useralldata?.walletBlance || "0")}
                        </span>
                    </div>
                </div>

                {/* Hero Character Image */}
                <div className="relative w-full flex justify-center mb-6 animate-fadeIn">
                    <img 
                        src="https://ik.imagekit.io/ufopzzlbh/addlovemodel.jpeg" 
                        alt="AddaLove Mascot" 
                        className="w-48 h-auto drop-shadow-[0_0_25px_rgba(255,41,148,0.4)]"
                    />
                </div>

                {/* Main Glassmorphism Card */}
                <div className="w-full bg-[#150A2A]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 shadow-2xl animate-fadeIn">
                    
                    {/* Balance Display Banner */}
                    <div className="bg-gradient-to-br from-[#2A0845] via-[#1C053A] to-[#0A0014] border border-[#FF2994]/30 rounded-2xl p-5 mb-5 relative overflow-hidden shadow-[0_0_20px_rgba(255,41,148,0.15)]">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF2994] rounded-full mix-blend-screen filter blur-[40px] opacity-30"></div>
                        
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <div className="text-[10px] tracking-widest text-slate-400 font-bold uppercase mb-1">
                                    Current Balance
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] tracking-tight">
                                        {balance ? balance : (useralldata?.walletBlance || "0")}
                                    </span>
                                    <span className="text-amber-400 font-bold text-sm mb-1.5 flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5" /> coins
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History Button */}
                    <button 
                        onClick={handleclick} 
                        className="w-full mb-6 flex items-center justify-between bg-[#1C1035] border border-white/5 hover:border-[#8B2BFF]/50 text-slate-200 transition-all px-4 py-3 rounded-xl text-sm font-medium group"
                    >
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-[#8B2BFF] group-hover:text-[#A75CFF] transition-colors" />
                            <span>Transaction History</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-[#2A1545] flex items-center justify-center group-hover:bg-[#8B2BFF]/20 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5 text-[#8B2BFF]" />
                        </div>
                    </button>

                    {/* Recharge Section Title */}
                    <div className="mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#FF2994] fill-[#FF2994]" />
                        <h2 className="text-lg font-bold tracking-wide text-white">Select a Package</h2>
                    </div>

                    {/* Grid of Coin Packages */}
                    <div className="grid grid-cols-3 gap-2.5 mb-6">
                        {coinPackages.map((pkg, index) => {
                            const isSelected = selectedPkg?.price === pkg.price;

                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setSelectedPkg(pkg);
                                        setIsModalOpen(true);
                                    }}
                                    className={`relative rounded-xl p-3 flex flex-col items-center justify-between border-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-[#FF2994] bg-[#2A0845] shadow-[0_0_15px_rgba(255,41,148,0.3)] transform scale-105 z-10'
                                            : pkg.popular
                                                ? 'border-[#8B2BFF]/50 bg-[#1C1035] hover:border-[#8B2BFF]'
                                                : 'border-white/5 bg-[#1A0B2E] hover:border-white/20'
                                    }`}
                                >
                                    {/* Elite Badges */}
                                    {pkg.popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-md flex items-center gap-0.5">
                                            <Crown className="w-2 h-2" /> Popular
                                        </div>
                                    )}

                                    {/* Coin Amount */}
                                    <div className="flex flex-col items-center gap-1 mb-2 mt-2">
                                        <Coins className={`w-6 h-6 ${pkg.popular || isSelected ? 'text-amber-400' : 'text-amber-400/70'}`} />
                                        <span className="text-amber-400 font-extrabold text-[15px] tracking-tight">
                                            {pkg.coins.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Sub-Labels / Bonus */}
                                    <div className="min-h-[16px] flex items-center justify-center mb-2 w-full">
                                        {pkg.tag ? (
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider w-full text-center ${
                                                pkg.tagType === 'basic' ? 'bg-white/5 text-slate-400' :
                                                pkg.tagType === 'popular' ? 'bg-[#8B2BFF]/20 text-[#A75CFF]' :
                                                pkg.tagType === 'best' ? 'bg-amber-500/20 text-amber-400' :
                                                'text-[#FF2994] bg-[#FF2994]/20'
                                            }`}>
                                                {pkg.tag}
                                            </span>
                                        ) : pkg.bonus ? (
                                            <span className="text-green-400 font-bold text-[9px] tracking-tight bg-green-500/10 px-1.5 py-0.5 rounded w-full text-center">
                                                {pkg.bonus}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Price Button Element */}
                                    <div className={`w-full py-1.5 rounded-lg text-center font-bold text-[13px] transition-colors ${
                                        isSelected ? 'bg-[#FF2994] text-white' : 'bg-white/5 text-slate-200 group-hover:bg-white/10'
                                    }`}>
                                        ₹{pkg.price.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust/Feature Badges */}
                    <div className="bg-[#1C1035] border border-white/5 rounded-xl p-3 grid grid-cols-3 gap-2 text-center divide-x divide-white/10">
                        <div className="flex flex-col items-center justify-center px-1">
                            <Shield className="w-4 h-4 text-[#8B2BFF] mb-1" />
                            <span className="text-[9px] font-bold text-slate-200 block">100% Secure</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-1">
                            <Zap className="w-4 h-4 text-[#FF2994] mb-1" />
                            <span className="text-[9px] font-bold text-slate-200 block">Instant Add</span>
                        </div>
                        <div className="flex flex-col items-center justify-center px-1">
                            <Percent className="w-4 h-4 text-[#8B2BFF] mb-1" />
                            <span className="text-[9px] font-bold text-slate-200 block">Best Value</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Confirmation Overlay Modal Drawer */}
            {isModalOpen && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-[#150A2A] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_0_40px_rgba(139,43,255,0.15)] relative">
                        
                        {/* Interactive Drag Pill */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 sm:hidden"></div>

                        <button
                            onClick={() => !isProcessing && setIsModalOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors z-10 bg-white/5 rounded-full p-1"
                            disabled={isProcessing}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 pt-8">
                            <h3 className="text-xl font-bold mb-6 text-center text-white flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#FF2994]" /> 
                                Confirm Package
                            </h3>

                            <div className="bg-[#1C1035] rounded-2xl p-5 border border-white/5 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-slate-400 font-medium">Coins Package</span>
                                    <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                        <Coins className="w-4 h-4 text-amber-400" />
                                        <span className="text-base font-bold text-amber-400">{selectedPkg.coins.toLocaleString()}</span>
                                    </div>
                                </div>

                                {selectedPkg.bonus && (
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-slate-400 font-medium">Bonus Allocation</span>
                                        <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{selectedPkg.bonus}</span>
                                    </div>
                                )}

                                <div className="h-px w-full bg-white/10 my-4"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-300 font-medium">Total Amount</span>
                                    <span className="text-2xl font-black text-white tracking-tight">₹{selectedPkg.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 mb-6 text-slate-400 text-xs">
                                <Shield className="w-4 h-4 text-green-400" />
                                Secured checkout via <span className="font-bold text-white tracking-wide">Razorpay</span>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold py-4 rounded-full transition-all flex justify-center items-center shadow-[0_0_20px_rgba(255,41,148,0.4)] hover:shadow-[0_0_25px_rgba(139,43,255,0.5)] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing Payment...
                                    </>
                                ) : (
                                    `Proceed to Pay ₹${selectedPkg.price.toLocaleString()}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation injection styling */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}