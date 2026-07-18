import React, { useState, useEffect } from 'react';
import { 
    Eye, 
    EyeOff, 
    Upload, 
    Loader, 
    Verified, 
    Smartphone, 
    Globe, 
    ChevronDown, 
    Sparkles, 
    ArrowRight,
    User,
    Mail,
    FileText,
    Calendar,
    Lock,
    Camera
} from 'lucide-react';
import { handleSuccess } from '../components/ErrorMessage';
import { Link, useNavigate } from 'react-router';
import shotlogo from "../assets/logo2.png";

export default function Signup() {
    // Step 1: Email verification (Phone in logic)
    const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP, 3: Registration
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
        <div className="min-h-screen bg-[#0A0014] text-slate-100 flex flex-col items-center py-6 px-4 font-sans relative overflow-x-hidden">
            
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center items-center">
                <div className="absolute top-[10%] w-[500px] h-[500px] bg-[#FF2994] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
                <div className="absolute bottom-[-10%] w-[400px] h-[400px] bg-[#8B2BFF] rounded-full mix-blend-screen filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md flex flex-col items-center z-10">
                
                {/* Header Section */}
                <div className="w-full flex justify-between items-center mb-4 px-2">
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

                {/* Hero Character Image (Only show on Step 1 & 2 to save space on form) */}
                {step < 3 && (
                    <div className="relative w-full flex justify-center mb-6">
                        <img 
                            src="https://ik.imagekit.io/ufopzzlbh/addlovemodel.jpeg" 
                            alt="AddaLove Mascot" 
                            className="w-48 h-auto drop-shadow-[0_0_25px_rgba(255,41,148,0.4)] transition-all duration-500"
                        />
                    </div>
                )}

                {/* Main Card */}
                <div className="w-full bg-[#150A2A]/90 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-2xl">
                    
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-1">
                            {step === 1 && "Create an Account"}
                            {step === 2 && "Verify OTP"}
                            {step === 3 && "Complete Profile"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {step === 1 && 'Enter your phone number to get started'}
                            {step === 2 && 'Enter the 6-digit code sent to your phone'}
                            {step === 3 && 'Tell us a bit more about yourself'}
                        </p>
                    </div>

                    {/* STEP 1: Phone Entry */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <Smartphone className="w-5 h-5 text-[#FF2994] shrink-0" />
                                    <input
                                        type="number"
                                        name='phoneNumber'
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            setPhoneNumber(e.target.value);
                                            if (errors.phoneNumber) setErrors({});
                                        }}
                                        placeholder="Phone Number"
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                    <div className="flex items-center text-slate-400 text-sm border-l border-white/10 pl-3 ml-2 shrink-0">
                                        +91 <ChevronDown className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                                {errors.phoneNumber && <p className="text-red-400 text-xs mt-1.5 px-2">{errors.phoneNumber}</p>}
                            </div>

                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Send OTP
                                    </>
                                )}
                            </button>

                            {/* Login Link Card */}
                            <Link 
                                to="/login"
                                className="mt-6 flex items-center justify-between w-full bg-[#1A0B2E] border border-white/5 hover:border-[#8B2BFF]/30 rounded-2xl p-4 transition-colors group cursor-pointer"
                            >
                                <span className="text-sm text-slate-300">
                                    Already have an account? <span className="text-[#8B2BFF] font-medium group-hover:text-[#A75CFF] transition-colors">Login</span>
                                </span>
                                <div className="w-7 h-7 rounded-full bg-[#2A1545] flex items-center justify-center group-hover:bg-[#8B2BFF]/20 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-[#8B2BFF]" />
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-4 focus-within:border-[#FF2994]/50 transition-colors">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => {
                                            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            if (errors.otp) setErrors({});
                                        }}
                                        placeholder="••••••"
                                        maxLength="6"
                                        className="w-full bg-transparent text-white placeholder-slate-600 text-center text-3xl tracking-[0.5em] font-bold outline-none"
                                    />
                                </div>
                                {errors.otp && <p className="text-red-400 text-xs mt-1.5 px-2 text-center">{errors.otp}</p>}
                            </div>

                            <button
                                onClick={handleSubmitOtp}
                                disabled={loading || otp.length !== 6}
                                className="w-full py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Verified className="w-4 h-4" />
                                        Verify OTP
                                    </>
                                )}
                            </button>

                            <div className="text-center flex justify-between items-center px-2">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setOtp('');
                                        setErrors({});
                                    }}
                                    className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
                                >
                                    Change Number
                                </button>
                                {timer > 0 ? (
                                    <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">Resend in {timer}s</span>
                                ) : (
                                    <button
                                        onClick={handleSendOtp}
                                        className="text-xs text-[#FF2994] hover:text-[#FF66AD] transition-colors font-medium"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Registration Form */}
                    {step === 3 && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
                            
                            {/* Profile Photo Upload inside Step 3 */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        id="photoInput"
                                    />
                                    <label
                                        htmlFor="photoInput"
                                        className={`flex flex-col items-center justify-center w-24 h-24 rounded-full cursor-pointer transition-all duration-300 overflow-hidden border-2 ${formData.profilePhotoPreview ? 'border-[#FF2994]' : 'border-dashed border-white/20 bg-[#1C1035] hover:border-[#FF2994]/50 hover:bg-[#251545]'}`}
                                    >
                                        {formData.profilePhotoPreview ? (
                                            <>
                                                <img
                                                    src={formData.profilePhotoPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Camera className="w-6 h-6 mb-1 text-slate-400 group-hover:text-[#FF2994] transition-colors" />
                                                <span className="text-[9px] font-medium uppercase tracking-wider group-hover:text-[#FF2994] transition-colors">Upload</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                                {errors.profilePhoto && <p className="text-red-400 text-xs mt-1.5">{errors.profilePhoto}</p>}
                            </div>

                            {/* Full Name */}
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <User className="w-5 h-5 text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Full Name"
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                </div>
                                {errors.fullName && <p className="text-red-400 text-xs mt-1 px-2">{errors.fullName}</p>}
                            </div>

                            {/* Phone (Read-only) */}
                            <div>
                                <div className="flex items-center bg-[#150A2A] border border-white/5 rounded-2xl px-4 py-3.5 opacity-80">
                                    <Verified className="w-5 h-5 text-green-400 shrink-0" />
                                    <input
                                        type="number"
                                        value={formData.phoneNumber}
                                        readOnly
                                        className="w-full bg-transparent text-slate-300 ml-3 outline-none text-sm cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                                    <input
                                        type="email"
                                        name='email'
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder='Email Address (Optional)'
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Age */}
                            <div>
                                <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                                    <input
                                        type="number"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Age (Min 18)"
                                        min="18"
                                        max="120"
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm"
                                    />
                                </div>
                                {errors.age && <p className="text-red-400 text-xs mt-1 px-2">{errors.age}</p>}
                            </div>

                            {/* Bio */}
                            <div>
                                <div className="flex items-start bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                    <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        placeholder="Write a short bio..."
                                        rows={2}
                                        className="w-full bg-transparent text-white placeholder-slate-500 ml-3 outline-none text-sm resize-none"
                                    />
                                </div>
                                {errors.bio && <p className="text-red-400 text-xs mt-1 px-2">{errors.bio}</p>}
                            </div>

                            {/* Passwords */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Password"
                                            className="w-full bg-transparent text-white placeholder-slate-500 ml-2 outline-none text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-slate-500 hover:text-white transition-colors shrink-0"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.password}</p>}
                                </div>
                                <div>
                                    <div className="flex items-center bg-[#1C1035] border border-white/5 rounded-2xl px-4 py-3.5 focus-within:border-[#FF2994]/50 transition-colors">
                                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm"
                                            className="w-full bg-transparent text-white placeholder-slate-500 ml-2 outline-none text-sm"
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="text-red-400 text-[10px] mt-1 px-1">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            {/* Error Message */}
                            {errors.submit && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                                    <p className="text-red-400 text-xs">{errors.submit}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-4 bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(255,41,148,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <User className="w-4 h-4" />
                                        Create Account
                                    </>
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
                                        bio: '',
                                        password: '',
                                        confirmPassword: '',
                                        profilePhoto: null,
                                        profilePhotoPreview: null,
                                    });
                                    setErrors({});
                                }}
                                className="w-full py-2 mt-2 text-slate-400 hover:text-white transition-colors text-xs font-medium"
                            >
                                Back to OTP
                            </button>
                        </form>
                    )}
                </div>

                {/* Progress Indicator */}
                <div className="flex gap-2 justify-center mt-6 z-10">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                i === step
                                    ? 'bg-gradient-to-r from-[#FF2994] to-[#8B2BFF] w-8 shadow-[0_0_10px_rgba(255,41,148,0.5)]'
                                    : i < step 
                                        ? 'bg-[#8B2BFF]/50 w-4'
                                        : 'bg-white/10 w-4'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Animation & Resets */}
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