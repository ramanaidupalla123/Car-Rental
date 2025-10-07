const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.enabled = true;
      this.fromEmail = process.env.EMAIL_FROM || '23pa1a05i7@vishnu.edu.in';
      this.fromName = process.env.EMAIL_FROM_NAME || 'Car Rentals';
      console.log('✅ SendGrid email service initialized');
    } else {
      this.enabled = false;
      console.log('⚠️ SendGrid API key not found');
    }
  }

  async sendOTP(email, otp) {
    console.log('🎯 OTP for manual testing:', otp);

    if (!this.enabled) {
      throw new Error('Email service not configured. Use manual OTP: ' + otp);
    }

    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Your OTP for Password Reset - Car Rentals',
        html: this.generateEmailTemplate(otp),
        trackSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        }
      };

      console.log('📤 Sending email via SendGrid...');
      console.log('📨 From:', this.fromEmail);
      console.log('📬 To:', email);
      console.log('🔑 OTP:', otp);
      
      const response = await sgMail.send(msg);
      
      console.log('✅ Email sent successfully via SendGrid');
      console.log('📋 Status:', response[0].statusCode);

      return {
        success: true,
        statusCode: response[0].statusCode,
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('❌ SendGrid API Error:');
      console.error('🔍 Error Message:', error.message);
      
      if (error.response) {
        console.error('📊 Response Body:', error.response.body);
      }
      
      throw new Error(`Email delivery failed. Use manual OTP: ${otp}`);
    }
  }

  generateEmailTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f7fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
          .content { padding: 30px; }
          .otp-display { font-size: 42px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 10px; background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0; border: 2px dashed #667eea; font-family: 'Courier New', monospace; }
          .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { background: #2d3748; color: #cbd5e0; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Car Rentals</h1>
            <p>Premium Car Rental Service</p>
          </div>
          <div class="content">
            <h2>Password Reset OTP</h2>
            <p>Use this OTP to reset your password. Valid for 10 minutes.</p>
            <div class="otp-display">${otp}</div>
            <div class="info-box">
              <strong>Security Notice:</strong>
              <ul>
                <li>Valid for 10 minutes only</li>
                <li>Do not share with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            <p><strong>Need help?</strong> Contact: carrentals@gmail.com | +91 9346551287</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Car Rentals. Bhimavaram, Andhra Pradesh</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();