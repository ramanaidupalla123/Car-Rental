const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

class NotificationService {
  constructor() {
    // Initialize Twilio SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.smsEnabled = true;
      console.log('✅ Twilio SMS service initialized');
    } else {
      this.smsEnabled = false;
      console.log('⚠️ Twilio credentials not found');
    }

    // Initialize SendGrid Email
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.emailEnabled = true;
      this.fromEmail = process.env.EMAIL_FROM;
      this.fromName = process.env.EMAIL_FROM_NAME;
      console.log('✅ SendGrid email service initialized');
    } else {
      this.emailEnabled = false;
      console.log('⚠️ SendGrid API key not found');
    }
  }

  /**
   * Send OTP via SMS using Twilio
   */
  async sendSMS(phoneNumber, otp) {
    if (!this.smsEnabled) {
      throw new Error('SMS service is not configured');
    }

    try {
      // Format phone number for India
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (!formattedPhone.startsWith('+91') && formattedPhone.length === 10) {
        formattedPhone = '+91' + formattedPhone;
      }

      const message = await this.twilioClient.messages.create({
        body: `Your Car Rentals OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log('✅ Twilio SMS sent successfully:', {
        to: formattedPhone,
        messageId: message.sid,
        status: message.status
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        provider: 'twilio'
      };
    } catch (error) {
      console.error('❌ Twilio SMS failed:', error.message);
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  }

  /**
   * Send OTP via Email using SendGrid
   */
  async sendEmail(email, otp) {
    if (!this.emailEnabled) {
      throw new Error('Email service is not configured');
    }

    try {
      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: 'Your OTP for Password Reset - Car Rental',
        html: this.generateEmailTemplate(otp),
        trackSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        }
      };

      console.log('📤 Sending email via SendGrid to:', email);
      
      const [response] = await sgMail.send(msg);
      
      console.log('✅ SendGrid email sent successfully!');
      console.log('📋 Message ID:', response.headers['x-message-id']);

      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: 'sendgrid'
      };
    } catch (error) {
      console.error('❌ SendGrid email failed:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Smart OTP Delivery - Try multiple methods
   */
  async sendOTP(contact, otp, method = 'email') {
    console.log(`🔄 Attempting ${method.toUpperCase()} delivery to:`, contact);

    // Always log OTP for manual testing
    console.log('🎯 OTP for manual testing:', otp);

    try {
      if (method === 'sms' && this.smsEnabled) {
        const result = await this.sendSMS(contact, otp);
        return { ...result, method: 'sms' };
      } 
      else if (method === 'email' && this.emailEnabled) {
        const result = await this.sendEmail(contact, otp);
        return { ...result, method: 'email' };
      }
      else {
        throw new Error(`Requested method (${method}) not available`);
      }
    } catch (error) {
      console.error(`❌ ${method.toUpperCase()} delivery failed:`, error.message);
      
      // Return manual fallback
      return {
        success: false,
        method: method,
        provider: 'manual',
        error: error.message,
        debugOtp: otp
      };
    }
  }

  /**
   * Generate beautiful email template
   */
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

module.exports = new NotificationService();