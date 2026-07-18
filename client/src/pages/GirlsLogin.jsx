import React, { useState } from 'react';
import { 
    Eye, 
    EyeOff, 
    Loader, 
    Smartphone, 
    Lock, 
    Globe, 
    ChevronDown, 
    Sparkles, 
    ArrowRight, 
    ShieldCheck, 
    Heart 
} from 'lucide-react';
import { handleSuccess } from '../components/ErrorMessage';
import { Link, useNavigate } from 'react-router';
import shotlogo from "../assets/logo2.png";

export default function GirlsLogin() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = 'Please enter your phone number';
        }
        if (!password) {
            newErrors.password = 'Please enter your password';
        }
        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            // API Call
            const url = `${import.meta.env.VITE_BACKEND_URL}/api/auth/v1/girl-login`
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phoneNumber, password }),
            });

            const data = await response.json();
            console.log(data)
            if (data.success) {
                // Handle successful login
                handleSuccess('Login successful!');
                navigate('/')
                // Redirect to dashboard or home
            } else {
                setErrors({ submit: data.message || 'Login failed' });
            }
        } catch (error) {
            setErrors({ submit: 'Error during login. Try again.' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Forgot Password
    const handleForgotPassword = () => {
        // Navigate to forgot password page or open modal
        navigate('/forget-password')
    };

    return (
        <div className="min-h-screen bg-[#0A0014] text-slate-100 flex flex-col items-center py-6 px-4 font-sans relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
                <div className="absolute top-[20%] w-[500px] h-[500px] bg-[#FF2994] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
                <div className="absolute bottom-0 w-[400px] h-[400px] bg-[#8B2BFF] rounded-full mix-blend-screen filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md flex flex-col items-center z-10">
                
                {/* Header Section */}
                <div className="w-full flex justify-between items-center mb-6 px-2">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Adda<span className="text-[#FF2994]">Love</span>
                        </h1>
                        <p className="text-[10px] text-slate-300 mt-0.5">Connect. Talk. <span className="text-[#FF2994]">Love.</span></p>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 transition">
                        <Globe className="w-3.5 h-3.5" />
                        English
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Hero Character Image */}
                <div className="relative w-full flex justify-center mb-6">
                    <img 
                        src="https://ik.imagekit.io/ufopzzlbh/addlovemodel.jpeg" 
                        alt="AddaLove Mascot" 
                        className="w-56 h-auto drop-shadow-[0_0_25px_rgba(255,41,148,0.4)]"
                    />
                </div>

                {/* Main Card */}
                <div className="w-full bg-[#150A2A]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl">
                    
                    <div className="animate-fadeIn">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-1">
                                Welcome to <span className="text-[#FF2994]">AddaLove</span>
                            </h2>
                            <p className="text-slate-400 text-sm">Girls Login - Welcome to your community</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            
                            {/* Phone Number Input */}
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <Smartphone className="w-5 h-5 text-[#FF2994] shrink-0" />
                                    <input
                                        type="number"
                                        name="phoneNumber"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            setPhoneNumber(e.target.value);
                                            if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
                                        }}
                                        placeholder="Phone Number"
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                    <div className="flex items-center text-slate-400 text-sm border-l border-white/10 pl-3 ml-2 shrink-0 cursor-pointer">
                                        +91 <ChevronDown className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1.5 px-2">{errors.phoneNumber}</p>}
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <Lock className="w-5 h-5 text-[#FF2994] shrink-0" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                        }}
                                        placeholder="Password"
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-slate-500 hover:text-white transition-colors shrink-0 ml-2"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1.5 px-2">{errors.password}</p>}
                            </div>

                            {/* Form Options (Remember Me & Forgot Password) */}
                            <div className="flex justify-between items-center px-1 pt-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-3.5 h-3.5 accent-[#FF2994] cursor-pointer rounded border-none bg-[#1C1035]"
                                    />
                                    <label htmlFor="rememberMe" className="text-xs text-slate-400 cursor-pointer">
                                        Remember me
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-[#FF2994] hover:text-[#FF66AD] font-medium transition-colors"
                                >
                                    Forgot Password?
                                </button>
                            </div>

                            {/* Submit Error */}
                            {errors.submit && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                                    <p className="text-red-400 text-xs">{errors.submit}</p>
                                </div>
                            )}

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Login
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Create Account Card */}
                        <Link 
                            to="/signupgirl"
                            className="mt-6 flex items-center justify-between w-full bg-[#1A0B2E] border border-white/5 hover:border-[#FF2994]/30 rounded-2xl p-4 transition-colors group cursor-pointer"
                        >
                            <span className="text-sm text-slate-300">
                                New here? <span className="text-[#FF2994] font-medium group-hover:text-[#FF66AD] transition-colors">Create an account</span>
                            </span>
                            <div className="w-7 h-7 rounded-full bg-[#2A1545] flex items-center justify-center group-hover:bg-[#FF2994]/20 transition-colors">
                                <ArrowRight className="w-4 h-4 text-[#FF2994]" />
                            </div>
                        </Link>
                        <Link 
                            to="/check-application"
                            className="mt-6 flex items-center justify-between w-full bg-[#1A0B2E] border border-white/5 hover:border-[#FF2994]/30 rounded-2xl p-4 transition-colors group cursor-pointer"
                        >
                            <span className="text-sm text-slate-300">
                                Alredy Applied? <span className="text-[#FF2994] font-medium group-hover:text-[#FF66AD] transition-colors">Check your application</span>
                            </span>
                            <div className="w-7 h-7 rounded-full bg-[#2A1545] flex items-center justify-center group-hover:bg-[#FF2994]/20 transition-colors">
                                <ArrowRight className="w-4 h-4 text-[#FF2994]" />
                            </div>
                        </Link>

                    </div>
                </div>

                {/* Footer Trust Badges */}
                <div className="w-full flex justify-between items-start mt-6 px-4 text-center animate-fadeIn">
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <ShieldCheck className="w-5 h-5 text-[#FF2994]/80" strokeWidth={1.5} />
                        <h4 className="text-[10px] font-semibold text-white">100% Secure</h4>
                        <p className="text-[9px] text-slate-400 leading-tight">Your privacy<br/>is our priority</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 border-x border-white/10">
                        <Lock className="w-5 h-5 text-[#8B2BFF]/80" strokeWidth={1.5} />
                        <h4 className="text-[10px] font-semibold text-white">Private & Safe</h4>
                        <p className="text-[9px] text-slate-400 leading-tight">End-to-end<br/>encrypted</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <Heart className="w-5 h-5 text-[#FF2994]/80" strokeWidth={1.5} />
                        <h4 className="text-[10px] font-semibold text-white">Real Connections</h4>
                        <p className="text-[9px] text-slate-400 leading-tight">Genuine people,<br/>real conversations</p>
                    </div>
                </div>
            </div>

            {/* Animation Injection */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                /* Hide number input spinners */
                input[type='number']::-webkit-inner-spin-button,
                input[type='number']::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type='number'] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
}