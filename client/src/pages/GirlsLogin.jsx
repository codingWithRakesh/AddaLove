import React, { useState } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { handleSuccess } from '../components/ErrorMessage';
import { Link, useNavigate } from 'react-router';
import shotlogo from "../assets/logo2.png"

export default function GirlsLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate()

    // Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Please enter your email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
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
                body: JSON.stringify({ email, password }),
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
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A] text-slate-100 flex items-center justify-center px-4 py-8">
            {/* Animated background blur elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-linear-to-r from-[#6C3BFF] to-[#FF4D8D] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Main Container */}
            <div className="relative w-full max-w-md">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block mb-4 p-3 bg-linear-to-r from-[rgb(28,1,11)] to-[#170352] rounded-full">
                            <img className='h-10' src={shotlogo} alt="AddaLove Logo" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2">
                            AddaLove
                        </h1>
                        <p className="text-slate-300 text-sm">Girls Login - Welcome to your community</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-200">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                }}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-slate-200">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-[#FF4D8D] hover:text-[#6C3BFF] transition-colors font-semibold"
                                >
                                    Forgot?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                    }}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 pr-10 hover:bg-white/5"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 accent-[#FF4D8D] cursor-pointer rounded"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-slate-300 cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        {/* Error Message */}
                        {errors.submit && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                <p className="text-red-300 text-xs">{errors.submit}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A]">
                                    Don't have an account?
                                </span>
                            </div>
                        </div>

                        {/* Sign Up Link */}
                        <Link
                            to="/signupgirl"
                            className="block w-full py-3 border border-white/20 text-white font-bold rounded-xl text-center hover:bg-white/5 hover:border-[#FF4D8D] transition-all duration-300 transform hover:scale-105"
                        >
                            Create Account
                        </Link>
                    </form>

                    {/* Footer Text */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        By signing in, you agree to our{' '}
                        <a href="/terms" className="text-[#FF4D8D] hover:text-[#6C3BFF] transition-colors">
                            Terms & Conditions
                        </a>
                    </p>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-1 mt-6 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Your login is secure and encrypted
                </div>
            </div>

            {/* Add animation for fadeIn */}
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
