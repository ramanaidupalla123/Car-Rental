// Enhanced Chat Widget Functionality with Fast Opening
class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.initializeChat();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    initializeChat() {
        // Create chat widget HTML
        const chatHTML = `
            <div class="chat-widget">
                <button class="chat-button" id="chatToggle">
                    <i class="fas fa-comments"></i>
                </button>
                <div class="chat-container" id="chatContainer">
                    <div class="chat-header">
                        <h3><i class="fas fa-headset"></i> Car Rentals Support</h3>
                        <button class="chat-close" id="chatClose">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <!-- Messages will be added here -->
                    </div>
                    <div class="typing-indicator" id="typingIndicator">
                        <span>Support is typing</span>
                        <span class="typing-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" class="chat-input" id="chatInput" placeholder="Type your message...">
                        <button class="send-button" id="sendMessage">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to body
        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Store references
        this.chatToggle = document.getElementById('chatToggle');
        this.chatContainer = document.getElementById('chatContainer');
        this.chatClose = document.getElementById('chatClose');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendMessage');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    setupEventListeners() {
        // Toggle chat
        this.chatToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleChat();
        });
        
        // Close chat
        this.chatClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat();
        });
        
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.chatContainer.contains(e.target) && 
                !this.chatToggle.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        // Show container immediately
        this.chatContainer.style.display = 'flex';
        
        // Force reflow to ensure display change is processed
        this.chatContainer.offsetHeight;
        
        // Add active class to trigger animation
        this.chatContainer.classList.add('active');
        this.isOpen = true;
        this.chatToggle.innerHTML = '<i class="fas fa-times"></i>';
        this.chatInput.focus();
        
        // Show welcome message if no messages yet
        if (this.messages.length === 0) {
            this.showWelcomeMessage();
        }
    }

    closeChat() {
        this.chatContainer.classList.remove('active');
        
        // Hide after animation completes
        setTimeout(() => {
            if (!this.isOpen) {
                this.chatContainer.style.display = 'none';
            }
        }, 150);
        
        this.isOpen = false;
        this.chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
    }

    showWelcomeMessage() {
        const welcomeHTML = `
            <div class="chat-welcome">
                <i class="fas fa-car"></i>
                <h4>Welcome to Car Rentals! 🚗</h4>
                <p>Hello! I'm your virtual assistant. How can I help you with our car rental services today?</p>
                <div class="quick-actions">
                    <button class="quick-action-btn" data-question="car-types">Available Car Types</button>
                    <button class="quick-action-btn" data-question="pricing">Pricing Information</button>
                    <button class="quick-action-btn" data-question="booking">How to Book</button>
                    <button class="quick-action-btn" data-question="account">Account Help</button>
                </div>
            </div>
        `;
        
        this.chatMessages.innerHTML = welcomeHTML;
        
        // Add event listeners to quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const question = e.target.getAttribute('data-question');
                this.handleQuickAction(question);
            });
        });
    }

    addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to messages history
        this.messages.push({
            text,
            isUser,
            time
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, true);
        this.chatInput.value = '';
        
        // Show typing indicator
        this.showTyping();
        
        // Get bot response after a short delay
        setTimeout(() => {
            this.hideTyping();
            const response = this.getBotResponse(message);
            this.addMessage(response);
        }, 1000 + Math.random() * 1000);
    }

    showTyping() {
        this.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTyping() {
        this.typingIndicator.classList.remove('active');
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    handleQuickAction(question) {
        let userMessage = '';
        let botResponse = '';
        
        switch(question) {
            case 'car-types':
                userMessage = 'What types of cars do you have?';
                botResponse = `We have a wide variety of cars to suit your needs:\n\n🚗 **SUV** - Perfect for family trips and off-road adventures\n🚙 **Sedan** - Comfortable and fuel-efficient for city driving\n🏎️ **Hatchback** - Compact and easy to park\n🚐 **MPV** - Spacious for larger groups\n\nYou can browse all available cars in our "Cars" section with detailed specifications and real-time availability!`;
                break;
                
            case 'pricing':
                userMessage = 'What are your pricing options?';
                botResponse = `Our pricing is competitive and transparent:\n\n💰 **Hourly Rates**: Starting from ₹200/hour\n💰 **Daily Rates**: Starting from ₹1200/day\n💰 **Weekly Packages**: Special discounts available\n💰 **Monthly Rentals**: Best value for long-term needs\n\nAll prices include basic insurance and 24/7 roadside assistance. You can see detailed pricing for each car when you select it for booking.`;
                break;
                
            case 'booking':
                userMessage = 'How do I book a car?';
                botResponse = `Booking a car is easy! Here's the simple process:\n\n1. **Browse Cars**: Check our available vehicles in the "Cars" section\n2. **Select Vehicle**: Click "Book Now" on your preferred car\n3. **Choose Dates**: Select pickup and return dates/times\n4. **Provide Details**: Enter your information and rental preferences\n5. **Review & Confirm**: Check details and confirm booking\n6. **Get Confirmation**: Receive booking confirmation via email/SMS\n\nYou'll need a valid driver's license and ID proof for verification.`;
                break;
                
            case 'account':
                userMessage = 'I need help with my account';
                botResponse = `I can help with various account-related issues:\n\n🔐 **Password Reset**: Go to Login → Forgot Password\n👤 **Profile Update**: Click your profile → Settings\n📧 **Email Change**: Contact support for email updates\n📱 **Phone Update**: Update in account settings\n🔍 **Booking History**: Check "My Bookings" section\n\nFor security-sensitive changes, you may need to verify your identity.`;
                break;
        }
        
        // Add user message and bot response
        this.addMessage(userMessage, true);
        this.showTyping();
        
        setTimeout(() => {
            this.hideTyping();
            this.addMessage(botResponse);
        }, 800);
    }

    getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Greetings
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Hello! 👋 Welcome to Car Rentals! How can I assist you with your car rental needs today?";
        }
        
        // Thank you responses
        if (message.includes('thank') || message.includes('thanks')) {
            return "You're welcome! 😊 I'm glad I could help. If you have any more questions about our car rental services, feel free to ask!";
        }
        
        // Goodbye
        if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
            return "Goodbye! 👋 Thank you for choosing Car Rentals. Have a great day and safe travels! 🚗";
        }
        
        // Car availability and types
        if (message.includes('available') || message.includes('car') || message.includes('vehicle') || message.includes('model')) {
            return "We have various cars available including SUVs, Sedans, Hatchbacks, and MPVs from brands like Toyota, Mahindra, Maruti Suzuki, Hyundai, Tata, and Kia. You can check all available cars in our 'Cars' section with detailed specifications, pricing, and real-time availability!";
        }
        
        // Pricing and costs
        if (message.includes('price') || message.includes('cost') || message.includes('rate') || message.includes('how much')) {
            return "Our rental rates start from ₹200 per hour or ₹1200 per day, depending on the car model. Premium and luxury vehicles may cost more. You can see exact pricing for each car when you select it for booking. All rates include basic insurance!";
        }
        
        // Booking process
        if (message.includes('book') || message.includes('reserve') || message.includes('rent') || message.includes('how to book')) {
            return "To book a car:\n1. Browse our 'Cars' section\n2. Select your preferred vehicle\n3. Click 'Book Now'\n4. Choose rental dates and duration\n5. Fill in your details\n6. Review and confirm\n\nYou'll need a valid driver's license and ID proof for verification.";
        }
        
        // Booking confirmation status
        if (message.includes('confirm') || message.includes('confirmed') || message.includes('booking status') || message.includes('my booking')) {
            return "To check your booking confirmation:\n1. Go to 'My Bookings' section\n2. Look for your recent booking\n3. Status will show: Pending/Confirmed/Completed\n4. You'll also receive email/SMS confirmation\n\nIf you don't see confirmation within 30 minutes, please contact support directly.";
        }
        
        // Account and password help
        if (message.includes('password') || message.includes('forgot password') || message.includes('reset password')) {
            return "To reset your password:\n1. Click 'Login' button\n2. Select 'Forgot Password'\n3. Enter your registered email\n4. Check email for reset link\n5. Create new password\n\nIf you don't receive the email, check spam folder or contact support.";
        }
        
        // Username/email change
        if (message.includes('username') || message.includes('email') || message.includes('change email') || message.includes('update email')) {
            return "For security reasons, email/username changes require verification:\n1. Login to your account\n2. Go to 'Settings'\n3. Select 'Profile Settings'\n4. Request email change\n5. Verify through confirmation email\n\nIf you face issues, our support team can assist you.";
        }
        
        // Profile updates
        if (message.includes('profile') || message.includes('update profile') || message.includes('change name') || message.includes('change phone')) {
            return "You can update your profile information:\n1. Login and click your profile\n2. Go to 'Settings'\n3. Select 'Profile Settings' tab\n4. Update your details\n5. Save changes\n\nPhone number and address can be updated directly. Name changes may require verification.";
        }
        
        // Payment questions
        if (message.includes('payment') || message.includes('pay') || message.includes('credit card') || message.includes('cash')) {
            return "We accept various payment methods:\n💳 Credit/Debit Cards\n📱 UPI Payments\n🏦 Net Banking\n💵 Cash (at pickup)\n\nPayment is required at booking confirmation. Security deposit may be applicable and will be refunded after vehicle return.";
        }
        
        // Cancellation policy
        if (message.includes('cancel') || message.includes('cancellation') || message.includes('refund')) {
            return "Our cancellation policy:\n✅ Free cancellation 24 hours before pickup\n⚠️ 50% refund if cancelled 2-24 hours before\n❌ No refund if cancelled less than 2 hours before\n\nYou can cancel bookings in 'My Bookings' section. Refunds processed within 5-7 business days.";
        }
        
        // Insurance and safety
        if (message.includes('insurance') || message.includes('cover') || message.includes('safe') || message.includes('accident')) {
            return "All rentals include:\n🛡️ Basic insurance coverage\n🚨 24/7 Roadside assistance\n🆘 Emergency support\n💰 Optional comprehensive insurance available\n\nIn case of accident, immediately contact support and follow safety protocols. Your safety is our priority!";
        }
        
        // Fuel policy
        if (message.includes('fuel') || message.includes('petrol') || message.includes('diesel') || message.includes('gas')) {
            return "Fuel policy:\n⛽ Cars provided with full tank\n🔄 Return with same fuel level\n💸 Refueling charges apply if returned with less fuel\n💰 Charged at market rates + service fee\n\nWe recommend returning the car with the same fuel level to avoid extra charges.";
        }
        
        // Documents required
        if (message.includes('document') || message.includes('license') || message.includes('aadhar') || message.includes('id proof')) {
            return "Required documents:\n📄 Valid driver's license\n🆔 ID proof (Aadhar, PAN, or Passport)\n📝 Recent passport-size photographs (2)\n\nFor international customers:\n🌍 International Driving Permit\n🛂 Passport and Visa copy\n🏨 Local address proof";
        }
        
        // Contact information
        if (message.includes('contact') || message.includes('call') || message.includes('phone') || message.includes('support')) {
            return `You can reach our 24/7 support team:\n\n📞 **Phone Support**:\n<div class="contact-info">
                <div class="contact-person">
                    <span class="contact-name">Rama Naidu:</span>
                    <a href="tel:+919346551287" class="contact-phone">+91 9346551287</a>
                </div>
                <div class="contact-person">
                    <span class="contact-name">Leela Sai:</span>
                    <a href="tel:+917981242049" class="contact-phone">+91 7981242049</a>
                </div>
            </div>\n\n📧 **Email**: carrentals@gmail.com\n🏢 **Address**: Bhimavaram, Andhra Pradesh\n\nWe're here to help you 24/7!`;
        }
        
        // Location and pickup
        if (message.includes('location') || message.includes('where') || message.includes('address') || message.includes('pickup')) {
            return "We have multiple convenient locations:\n📍 Main Office: Bhimavaram, Andhra Pradesh\n🚗 Free pickup/drop-off within city limits\n🛬 Airport pickup available (additional charge)\n🏨 Hotel delivery service\n\nSpecific pickup location will be confirmed after booking. You'll receive exact address and timing details.";
        }
        
        // Emergency contact
        if (message.includes('emergency') || message.includes('urgent') || message.includes('help') || message.includes('breakdown')) {
            return `🚨 **Emergency Support** 🚨\n\nFor immediate assistance:\n\n📞 **24/7 Emergency Helpline**:\n<div class="contact-info">
                <div class="contact-person">
                    <span class="contact-name">Rama Naidu:</span>
                    <a href="tel:+919346551287" class="contact-phone emergency">+91 9346551287</a>
                </div>
            </div>\n\nIn case of:\n• Accident 🚑\n• Breakdown 🔧\n• Lockout 🔐\n• Emergency 🆘\n\nCall immediately - we provide quick roadside assistance!`;
        }
        
        // Operating hours
        if (message.includes('time') || message.includes('hour') || message.includes('open') || message.includes('close')) {
            return "Our operating hours:\n🕒 **Office Hours**: 6:00 AM - 11:00 PM daily\n📞 **Phone Support**: 24/7 Available\n🚗 **Car Pickup/Return**: 6:00 AM - 11:00 PM\n🆘 **Emergency Service**: 24/7\n\nAfter-hours pickup/return available with prior arrangement.";
        }
        
        // Default response for unrecognized queries
        return `I understand you're asking about: "${userMessage}". While I'm here to help with car rental services, account management, bookings, and general inquiries, for more specific or complex issues, I recommend contacting our support team directly for personalized assistance.\n\n📞 **Support Team**:\n• Rama Naidu: +91 9346551287\n• Leela Sai: +91 7981242049\n\nThey'll be happy to help you with this specific question! Is there anything else about our car rental services I can help you with?`;
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on main pages
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('.html') === false) {
        
        console.log('💬 Initializing enhanced chat widget...');
        window.chatWidget = new ChatWidget();
    }
});