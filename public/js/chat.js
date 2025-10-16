// Chat Widget Functionality
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
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        
        // Close chat
        this.chatClose.addEventListener('click', () => this.closeChat());
        
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
                    <button class="quick-action-btn" data-question="contact">Contact Support</button>
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
        }, 1000 + Math.random() * 1000); // Random delay for natural feel
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
                botResponse = `We have a wide variety of cars to suit your needs:\n\n🚗 **SUV** - Perfect for family trips and off-road adventures\n🚙 **Sedan** - Comfortable and fuel-efficient for city driving\n🏎️ **Hatchback** - Compact and easy to park\n🚐 **MPV** - Spacious for larger groups\n\nYou can browse all available cars in our "Cars" section!`;
                break;
                
            case 'pricing':
                userMessage = 'What are your pricing options?';
                botResponse = `Our pricing is competitive and transparent:\n\n💰 **Hourly Rates**: Starting from ₹200/hour\n💰 **Daily Rates**: Starting from ₹1200/day\n💰 **Weekly Packages**: Special discounts available\n\nAll prices include basic insurance and 24/7 roadside assistance. You can see detailed pricing for each car in our booking section.`;
                break;
                
            case 'booking':
                userMessage = 'How do I book a car?';
                botResponse = `Booking a car is easy! Here's how:\n\n1. **Browse Cars**: Check our available vehicles\n2. **Select Dates**: Choose your pickup and return dates\n3. **Provide Details**: Enter your information\n4. **Confirm Booking**: Review and confirm\n5. **Pick Up**: Collect your car at the scheduled time\n\nYou'll need a valid driver's license and ID proof for booking.`;
                break;
                
            case 'contact':
                userMessage = 'How can I contact support?';
                botResponse = `For immediate assistance, you can contact our support team:\n\n📞 **Phone Support**:\n<div class="contact-info">
                    <div class="contact-person">
                        <span class="contact-name">Rama Naidu:</span>
                        <a href="tel:+919346551287" class="contact-phone">+91 9346551287</a>
                    </div>
                    <div class="contact-person">
                        <span class="contact-name">Leela Sai:</span>
                        <a href="tel:+917981242049" class="contact-phone">+91 7981242049</a>
                    </div>
                </div>\n\nWe're available 24/7 to help you with any queries!`;
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
        
        // Car availability
        if (message.includes('available') || message.includes('car') || message.includes('vehicle')) {
            return "We have various cars available including SUVs, Sedans, Hatchbacks, and MPVs. You can check all available cars in our 'Cars' section with detailed specifications and real-time availability!";
        }
        
        // Pricing
        if (message.includes('price') || message.includes('cost') || message.includes('rate')) {
            return "Our rental rates start from ₹200 per hour or ₹1200 per day, depending on the car model. Would you like to know the specific pricing for a particular type of car?";
        }
        
        // Booking process
        if (message.includes('book') || message.includes('reserve') || message.includes('rent')) {
            return "To book a car, simply:\n1. Go to our 'Cars' section\n2. Select your preferred vehicle\n3. Choose rental dates\n4. Fill in your details\n5. Confirm booking\n\nYou'll need a valid driver's license for the booking process.";
        }
        
        // Contact information
        if (message.includes('contact') || message.includes('call') || message.includes('phone')) {
            return `You can reach our support team at:\n\n<div class="contact-info">
                <div class="contact-person">
                    <span class="contact-name">Rama Naidu:</span>
                    <a href="tel:+919346551287" class="contact-phone">+91 9346551287</a>
                </div>
                <div class="contact-person">
                    <span class="contact-name">Leela Sai:</span>
                    <a href="tel:+917981242049" class="contact-phone">+91 7981242049</a>
                </div>
            </div>\n\nWe're here to help 24/7!`;
        }
        
        // Location
        if (message.includes('location') || message.includes('where') || message.includes('address')) {
            return "Our main office is located in Bhimavaram, Andhra Pradesh. We offer pickup and drop-off services at convenient locations across the city.";
        }
        
        // Requirements
        if (message.includes('require') || message.includes('need') || message.includes('document')) {
            return "To rent a car, you'll need:\n• Valid driver's license\n• ID proof (Aadhar, PAN, or Passport)\n• Security deposit (refundable)\n\nFor international customers, an International Driving Permit is required.";
        }
        
        // Insurance
        if (message.includes('insurance') || message.includes('cover') || message.includes('safe')) {
            return "All our rentals include basic insurance coverage. We also offer additional insurance options for comprehensive protection. Your safety is our priority!";
        }
        
        // Fuel policy
        if (message.includes('fuel') || message.includes('petrol') || message.includes('diesel')) {
            return "We provide cars with a full tank of fuel. Please return the car with the same amount of fuel, or we'll charge for refueling at market rates plus a service fee.";
        }
        
        // Default response
        return "I understand you're asking about: '" + userMessage + "'. For detailed assistance with this query, please contact our support team directly at:\n\n📞 **Rama Naidu**: +91 9346551287\n📞 **Leela Sai**: +91 7981242049\n\nThey'll be happy to help you with this specific question!";
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on index.html page
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('.html') === false) {
        
        console.log('💬 Initializing chat widget...');
        window.chatWidget = new ChatWidget();
    }
});