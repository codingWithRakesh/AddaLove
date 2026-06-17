import React, { useState } from 'react';
import { handleError, handleSuccess } from '../components/ErrorMessage';
import { History } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUserData } from '../context/UserdataContext';
const coinPackages = [
    { coins: 25, price: 9, bonus: null },
    { coins: 95, price: 29, bonus: null },
    { coins: 180, price: 49, bonus: null },
    { coins: 400, price: 99, bonus: null },
    { coins: 880, price: 199, bonus: null },
    { coins: 2400, price: 499, bonus: '+200 bonus', popular: true },
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
    const { useralldata } = useUserData();
    // const [orderdata, setOrderdata] = useState({})
    const [balance, setBalance] = useState(0)
    const naviget = useNavigate()

    const handleclick = () => {
        naviget('/transcation-history')
    }
    // Simulated API Call
    const handlePayment = async () => {
        setIsProcessing(true);
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/creat-coin-order`
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount: selectedPkg.price, coins: selectedPkg.coins, bonus: selectedPkg.bonus }),
        });
        // Simulate network delay (e.g., calling your backend API)
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        const data = await response.json();
        console.log(data)
        if (!data.success) {
            return handleError('Network issue try again!')
        }
        const orderId = data.data.order.id;
        const amount = data.data.order.amount
        const currency = data.data.order.currency;
        // console.log(data.data.order.notes)
        const orderdata = data.data.order.notes
        // Reset state after "successful" call

        // handleSuccess("Payment details sent to backend successfully!");

        const option = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from Razorpay Dashboard
            amount: amount,
            currency: currency,
            name: 'AddaLove💖',
            description: 'Conis buy',
            order_id: orderId,
            callback_url: import.meta.env.VITE_CALLBACK_URL,
            handler: async function (response) {
                const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
                console.log(razorpay_payment_id, razorpay_order_id, razorpay_signature)

                // Send to backend for verification
                const url2 = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/verify-payment`
                const responce = await fetch(url2, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ razorpay_payment_id: razorpay_payment_id, razorpay_order_id: razorpay_order_id, razorpay_signature: razorpay_signature }),

                })
                const data2 = await responce.json()
                if (data2.success) {
                    handleSuccess('Payment successful !');
                    console.log(orderdata)
                    let totalbouns;
                    if (orderdata.bonus === '+200 bonus') {
                        totalbouns = 200;
                    }
                    else if (orderdata.bonus === '+500 bonus') {
                        totalbouns = 500;
                    }
                    else if (orderdata.bonus === '+1500 bonus') {
                        totalbouns = 1500;
                    }
                    else if (orderdata.bonus === '+3500 bonus') {
                        totalbouns = 2500;
                    }
                    else if (orderdata.bonus === '+8000 bonus') {
                        totalbouns = 8000;
                    }
                    else if (orderdata.bonus === '+15000 bonus') {
                        totalbouns = 15000;
                    }
                    else if (orderdata.bonus === '+35000 bonus') {
                        totalbouns = 15000;
                    }
                    else {
                        totalbouns = 0;
                    }
                    const url3 = `${import.meta.env.VITE_BACKEND_URL}/api/wallet/v1/add-coin`
                    const res = await fetch(url3, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: 'include',
                        body: JSON.stringify({ userId: orderdata.userId, coins: orderdata.coins, bonus: totalbouns, razorpay_payment_id: razorpay_payment_id, razorpay_order_id: razorpay_order_id, amount: amount })

                    })
                    const data3 = await res.json()
                    console.log(data3)
                    if (data3.success) {
                        setBalance(data3.data.newWlletBlance)
                        setIsProcessing(false);
                        setIsModalOpen(false);
                        setSelectedPkg(null);
                    }
                }
                else {
                    handleError("Payment fail")
                    setLoder(false)
                }
                // You can verify payment here by sending info to the backend
            },
            prefill: {
                name: `${orderdata.username}`,
                email: `${orderdata.useremail}`,
            },
            theme: {
                color: '#6F42C1',
            },
        }
        try {
            const rzp = new window.Razorpay(option);
            rzp.open();
        } catch (error) {
            setLoder(false)
            handleError('Payment Cancel')
            console.error('Payment Error:', error);
        }
        finally {
            setLoder(false)
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0c11] text-white font-sans selection:bg-pink-500 selection:text-white relative pb-24">
            <div className="max-w-3xl mx-auto p-4 md:p-6 lg:p-8">

                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-pink-500">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                            <h1 className="text-xl font-bold tracking-wide">
                                <span className="text-pink-500">Adda</span>
                                <span className="text-purple-500">Love</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#1e1c25] px-3 py-1.5 rounded-full border border-gray-800">
                            <CoinIcon className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-bold text-sm">100</span>
                        </div>

                        <button className="text-gray-400 hover:text-white transition-colors relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            <span className="absolute top-0 right-1 w-2 h-2 bg-pink-500 rounded-full border border-[#0d0c11]"></span>
                        </button>
                    </div>
                </header>

                {/* Balance Card Section */}
                <div className="bg-linear-to-br from-[#1d1927] to-[#111016] border border-gray-800/60 rounded-3xl p-6 mb-10 shadow-lg relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-gray-400 mb-2 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-pink-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                            </svg>
                            <span className="text-sm tracking-widest uppercase">Your Balance</span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-5xl font-black text-yellow-400 tracking-tight">{useralldata.walletBlance}</span>
                            <span className="text-lg font-bold text-yellow-400">coins</span>
                        </div>
                        <div className="text-gray-500 text-sm mb-6 font-medium">
                            ≈ ₹0.99 value
                        </div>

                        <button onClick={handleclick} className="flex items-center gap-2 bg-[#251e12] border border-[#52441a] text-yellow-400 hover:bg-[#332816] transition-colors px-5 py-2.5 rounded-xl text-sm font-semibold shadow-inner">
                            <History />
                            Your transcation history
                        </button>
                    </div>
                </div>

                {/* Recharge Section Title */}
                <div className="flex items-center gap-2 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                        <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-xl font-bold tracking-wide">Recharge Coins</h2>
                </div>

                {/* Grid of Coin Packages */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {coinPackages.map((pkg, index) => {
                        const isSelected = selectedPkg?.price === pkg.price;

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedPkg(pkg)}
                                className={`relative bg-[#17161c] rounded-2xl p-5 flex flex-col justify-between border transition-all cursor-pointer group hover:-translate-y-1 ${isSelected
                                    ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-[#2a1a29]'
                                    : pkg.popular
                                        ? 'border-pink-500/50 hover:border-pink-400'
                                        : 'border-transparent hover:border-gray-600'
                                    }`}
                            >
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(236,72,153,0.5)] whitespace-nowrap">
                                        Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <CoinIcon className={`w-6 h-6 text-yellow-400 transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="text-yellow-400 font-extrabold text-2xl tracking-tight">
                                        {pkg.coins.toLocaleString()}
                                    </span>
                                </div>

                                <div className="mt-1 h-5">
                                    {pkg.bonus && (
                                        <span className="text-green-500 font-bold text-xs tracking-wide">
                                            {pkg.bonus}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <span className="text-white font-bold text-xl">
                                        ₹{pkg.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Recharge Button */}
            {selectedPkg && (
                <div className="fixed bottom-0 left-0 w-full p-4 bg-[#0d0c11]/80 backdrop-blur-md border-t border-gray-800 z-40 flex justify-center animate-fade-in-up">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full max-w-md bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex justify-between items-center"
                    >
                        <span className="text-lg">Continue Recharge</span>
                        <span className="text-xl">₹{selectedPkg.price.toLocaleString()}</span>
                    </button>
                </div>
            )}

            {/* Payment Modal */}
            {isModalOpen && selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1a1721] border border-gray-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">

                        {/* Close Button */}
                        <button
                            onClick={() => !isProcessing && setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                            disabled={isProcessing}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-6">
                            <h3 className="text-xl font-bold mb-6 text-center">Confirm Recharge</h3>

                            <div className="bg-[#110f16] rounded-2xl p-5 border border-gray-800 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-400">Coins</span>
                                    <div className="flex items-center gap-1">
                                        <CoinIcon className="w-5 h-5 text-yellow-400" />
                                        <span className="text-lg font-bold text-yellow-400">{selectedPkg.coins.toLocaleString()}</span>
                                    </div>
                                </div>

                                {selectedPkg.bonus && (
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-400">Bonus</span>
                                        <span className="text-sm font-bold text-green-500">{selectedPkg.bonus}</span>
                                    </div>
                                )}

                                <div className="h-px w-full bg-gray-800 my-4"></div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 font-medium">Total Amount</span>
                                    <span className="text-2xl font-black text-white">₹{selectedPkg.price.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Razorpay Banner Simulation */}
                            <div className="flex items-center justify-center gap-2 mb-6 text-gray-400 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.25 8.25v-3a3.25 3.25 0 10-6.5 0v3h6.5z" clipRule="evenodd" />
                                </svg>
                                Secured by <span className="font-bold text-white tracking-wide text-[15px]">Razorpay</span>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center h-14"
                            >
                                {isProcessing ? (
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    `Pay Now (₹${selectedPkg.price.toLocaleString()})`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add a simple custom animation for the floating button */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}} />
        </div>
    );
}

// Simple reusable Coin SVG Component
function CoinIcon({ className }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <circle cx="12" cy="12" r="10" fill="#facc15" />
            <circle cx="12" cy="12" r="8" fill="#eab308" />
            <path d="M12 6V18M9 9H15M9 15H15" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}