import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Upload, Loader, Verified } from 'lucide-react';
import { handleSuccess } from '../components/ErrorMessage';
import { Link, useNavigate } from 'react-router';
import shotlogo from "../assets/logo2.png"
export default function Signup() {
    // Step 1: Email verification
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Registration
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState('');
    const [referenceCode, setReferenceCode] = useState('')
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [timer, setTimer] = useState(0);
    const naviget = useNavigate()
    // Step 3: Registration form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        age: '',
        bio: '',
        password: '',
        confirmPassword: '',
        profilePhoto: null,
        profilePhotoPreview: null,
    });

    const [errors, setErrors] = useState({});

    // OTP Timer Effect
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // STEP 1: Send OTP
    const handleSendOtp = async () => {
        const cleanedPhone = phoneNumber.trim();

        // Validation
        if (!cleanedPhone) {
            setErrors({ phoneNumber: 'Phone number is required.' });
            return;
        }

        const phoneRegex = /^[6-9]\d{9}$/;

        if (!phoneRegex.test(cleanedPhone)) {
            setErrors({
                phoneNumber: 'Please enter a valid 10-digit Indian mobile number.',
            });
            return;
        }


        setLoading(true);
        try {
            // API Call
            const url = `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/send-sms-otp`
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber:cleanedPhone }),
            });

            const data = await response.json();
            console.log(data)
            if (data.success) {
                setReferenceCode(data.data.referenceCode)
                setStep(2);
                setOtpSent(true);
                setTimer(120);
                setErrors({});
            } else {
                setErrors({ phoneNumber: data.message || 'Failed to send OTP' });
            }
        } catch (error) {
            setErrors({ phoneNumber: 'Error sending OTP. Try again.' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // STEP 2: Submit OTP
    const handleSubmitOtp = async () => {
        if (!otp.trim() || otp.length !== 6) {
            setErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        try {
            // API Call
            const url = `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/verify-otp`
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp, referenceCode }),
            });

            const data = await response.json();
            console.log(data)
            if (data.success) {
                setStep(3);
                setFormData(prev => ({ ...prev, phoneNumber }));
                setErrors({});
            } else {
                setErrors({ otp: data.message || 'Invalid OTP' });
            }
        } catch (error) {
            setErrors({ otp: 'Network issue. Try again.' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // STEP 3: Handle photo upload
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, profilePhoto: 'File size must be less than 5MB' }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    profilePhoto: file,
                    profilePhotoPreview: reader.result,
                }));
                setErrors(prev => ({ ...prev, profilePhoto: '' }));
            };
            reader.readAsDataURL(file);
        }
    };

    // STEP 3: Validate & Submit Registration
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        // Validation
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.age) newErrors.age = 'Age is required';
        if (formData.age < 18) newErrors.age = 'Must be at least 18 years old';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            // Create FormData for file upload
            const url = `${import.meta.env.VITE_BACKEND_URL2}/api/auth/v1/register`
            const submitData = new FormData();
            submitData.append('fullName', formData.fullName);
            submitData.append('email', formData.email);
            submitData.append('phoneNumber', formData.phoneNumber)
            submitData.append('age', formData.age);
            submitData.append('password', formData.password);
            submitData.append('bio', formData.bio)
            submitData.append('profilePhoto', formData.profilePhoto);

            // API Call
            const response = await fetch(url, {
                method: 'POST',
                body: submitData,
            });

            const data = await response.json();

            if (data.success) {
                // Handle successful registration
                handleSuccess('Registration successful!');
                naviget('/login')
                // Redirect to login or dashboard
                // window.location.href = '/login';
            } else {
                setErrors({ submit: data.message || 'Registration failed' });
            }
        } catch (error) {
            setErrors({ submit: 'Error during registration. Try again.' });
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                            <img className='h-10' src={shotlogo} alt="" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] bg-clip-text text-transparent mb-2">
                            AddaLove
                        </h1>
                        <p className="text-slate-300 text-sm">
                            {step === 1 && 'Enter your email to get started'}
                            {step === 2 && 'Enter the OTP sent to your email'}
                            {step === 3 && 'Complete your profile'}
                        </p>
                    </div>

                    {/* STEP 1: Email Entry */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Phone number
                                </label>
                                <input
                                    type="number"
                                    name='phoneNumber'
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        setPhoneNumber(e.target.value);
                                        if (errors.phoneNumber) setErrors({});
                                    }}
                                    placeholder="eg. 8665237845"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 hover:bg-white/5"
                                />
                                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1">{errors.phoneNumber}</p>}
                            </div>

                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send OTP'
                                )}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/20"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-linear-to-br from-[#0F172A] via-[#1a1f3a] to-[#0F172A]">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            {/* Sign Up Link */}
                            <Link
                                to="/login"
                                className="block w-full py-3 border border-white/20 text-white font-bold rounded-xl text-center hover:bg-white/5 hover:border-[#FF4D8D] transition-all duration-300 transform hover:scale-105"
                            >
                                Login
                            </Link>
                        </div>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        if (errors.otp) setErrors({});
                                    }}
                                    placeholder="000000"
                                    maxLength="6"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-center text-2xl tracking-widest font-bold hover:bg-white/5"
                                />
                                {errors.otp && <p className="text-red-400 text-xs mt-1">{errors.otp}</p>}
                            </div>

                            <button
                                onClick={handleSubmitOtp}
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify OTP'
                                )}
                            </button>

                            <div className="text-center flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setOtp('');
                                        setErrors({});
                                    }}
                                    className="text-xs text-slate-400 hover:text-[#FF4D8D] transition-colors"
                                >
                                    Back
                                </button>
                                {timer > 0 ? (
                                    <span className="text-xs text-slate-400">Resend in {timer}s</span>
                                ) : (
                                    <button
                                        onClick={handleSendOtp}
                                        className="text-xs text-[#FF4D8D] hover:text-[#6C3BFF] transition-colors"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Registration Form */}
                    {step === 3 && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm hover:bg-white/5"
                                />
                                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Email (Read-only) */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    <div className='flex gap-2'>Phone Number (Verified) <Verified className='h-5 text-blue-600' /></div>
                                </label>
                                <input
                                    type="number"
                                    value={formData.phoneNumber}
                                    readOnly
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-300 cursor-not-allowed opacity-70 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name='email'
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder='Enter email'
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm hover:bg-white/5"
                                />
                            </div>

                            {/* Age */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    placeholder="Tell us about yourself"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm hover:bg-white/5 resize-none"
                                />
                                {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Age
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    placeholder="18"
                                    min="18"
                                    max="120"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm hover:bg-white/5"
                                />
                                {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
                            </div>

                            {/* Profile Photo Upload */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Profile Photo
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        id="photoInput"
                                    />
                                    <label
                                        htmlFor="photoInput"
                                        className="flex flex-col items-center justify-center w-full px-4 py-3 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#FF4D8D] hover:bg-white/10 transition-all duration-300 gap-2"
                                    >
                                        {formData.profilePhotoPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={formData.profilePhotoPreview}
                                                    alt="Preview"
                                                    className="w-20 h-20 rounded-lg object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Upload className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-400" />
                                                <span className="text-xs text-slate-400">Click to upload photo</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                {errors.profilePhoto && <p className="text-red-400 text-xs mt-1">{errors.profilePhoto}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm pr-10 hover:bg-white/5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-200">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FF4D8D] focus:bg-white/10 transition-all duration-300 text-sm pr-10 hover:bg-white/5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#FF4D8D] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>

                            {/* Error Message */}
                            {errors.submit && (
                                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                    <p className="text-red-300 text-xs">{errors.submit}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-[#FF4D8D]/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setStep(2);
                                    setFormData({
                                        fullName: '',
                                        email: '',
                                        age: '',
                                        password: '',
                                        confirmPassword: '',
                                        profilePhoto: null,
                                        profilePhotoPreview: null,
                                    });
                                    setErrors({});
                                }}
                                className="w-full py-2 text-slate-300 hover:text-[#FF4D8D] transition-colors text-sm font-semibold"
                            >
                                Back
                            </button>
                        </form>
                    )}
                </div>

                {/* Progress Indicator */}
                <div className="flex gap-2 justify-center mt-8">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-300 ${i <= step
                                ? 'bg-linear-to-r from-[#FF4D8D] to-[#6C3BFF] w-8'
                                : 'bg-white/20 w-6'
                                }`}
                        />
                    ))}
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
