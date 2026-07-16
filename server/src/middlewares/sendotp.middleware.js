import nodemailer from 'nodemailer'
import util from 'util'

const sendemail = async (sendtoemail, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,      // Your email
            pass: process.env.PASSWORD    // App password (not your real password)
        }
    });

    const otpEmailTemplateHTML = (otp) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>AddaLove Password Reset</title>

<style>
body{
    margin:0;
    padding:0;
    background:#0F172A;
    font-family:'Poppins', Arial, Helvetica, sans-serif;
}

.container{
    max-width:600px;
    margin:40px auto;
    background:#1E293B;
    border-radius:20px;
    overflow:hidden;
    border:1px solid rgba(255,255,255,0.08);
    box-shadow:0 10px 40px rgba(0,0,0,0.35);
}

.header{
    background:linear-gradient(
        90deg,
        #6C3BFF,
        #FF4D8D
    );
    
    padding:30px;
    
    text-align:center;
    
    color:white;
    
    font-size:30px;
    
    font-weight:700;
    
    letter-spacing:1px;
}

.content{
    padding:40px 30px;
    color:#E2E8F0;
    text-align:center;
}

.content h2{
    margin-top:0;
    margin-bottom:15px;
    color:#FFFFFF;
    font-size:28px;
}

.content p{
    line-height:1.7;
    font-size:15px;
}

.otp-box{
    display:inline-block;

    margin:30px 0;

    padding:20px 35px;

    font-size:32px;

    font-weight:700;

    letter-spacing:8px;

    background:linear-gradient(
        135deg,
        rgba(108,59,255,0.18),
        rgba(255,77,141,0.18)
    );

    border:1px solid rgba(255,77,141,0.35);

    border-radius:16px;

    color:#FFFFFF;

    box-shadow:
        0 10px 30px rgba(108,59,255,0.25);
}

.info{
    font-size:14px;
    color:#94A3B8;
    margin-top: 20px;
}

.highlight{
    color:#FF4D8D;
    font-weight:600;
}

.footer{
    padding:20px;

    text-align:center;

    font-size:13px;

    color:#94A3B8;

    border-top:1px solid rgba(255,255,255,0.08);
}

.footer a{
    color:#4DA6FF;
    text-decoration:none;
}
</style>

</head>

<body>

<div class="container">

    <div class="header">
        🔒 AddaLove
    </div>

    <div class="content">

        <h2>Password Reset</h2>

        <p>
            Hello from <span class="highlight">AddaLove</span>!
        </p>

        <p>
            We received a request to reset the password for your account. Please use the following OTP to securely change your password.
        </p>

        <div class="otp-box">
            ${otp}
        </div>

        <p class="info">
            This OTP is valid for the next <b>10 minutes</b>.<br><br>
            <i>If you did not request a password reset, please ignore this email or contact support immediately.</i><br>
            Never share this code with anyone.
        </p>

    </div>

    <div class="footer">
        © 2026 AddaLove • Connect • Chat • Discover ❤️
    </div>

</div>

</body>
</html>
`;

    const mailOptions = {
        from: process.env.EMAIL,
        to: sendtoemail,
        subject: "🔒 AddaLove Password Reset OTP",
        html: otpEmailTemplateHTML(otp),
    };

    // Convert sendMail to return a promise
    const sendMailAsync = util.promisify(transporter.sendMail.bind(transporter));

    try {
        const info = await sendMailAsync(mailOptions);
        console.log("✅ Email sent:", info.response);
        return info.response;  // Return the response
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;   // Throw error for proper handling
    }
}

export default sendemail;