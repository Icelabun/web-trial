class VirtualAssistant {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.initSpeechRecognition();
        this.createAssistantBubble();
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const command = event.results[0][0].transcript.toLowerCase();
                this.handleVoiceCommand(command);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }
    }

    createAssistantBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'assistant-bubble';
        bubble.innerHTML = `
            <div class="bubble-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="bubble-content">
                <div class="bubble-header">
                    <h3>Virtual Assistant</h3>
                    <button class="voice-btn">
                        <i class="fas fa-microphone"></i>
                    </button>
                </div>
                <div class="bubble-body">
                    <div class="messages"></div>
                    <div class="input-area">
                        <input type="text" placeholder="Type your question...">
                        <button class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(bubble);

        // Event Listeners
        const bubbleIcon = bubble.querySelector('.bubble-icon');
        const voiceBtn = bubble.querySelector('.voice-btn');
        const sendBtn = bubble.querySelector('.send-btn');
        const input = bubble.querySelector('input');

        bubbleIcon.addEventListener('click', () => {
            bubble.classList.toggle('expanded');
        });

        voiceBtn.addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        sendBtn.addEventListener('click', () => {
            this.handleUserInput(input.value);
            input.value = '';
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserInput(input.value);
                input.value = '';
            }
        });
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            this.addMessage('Speech recognition is not supported in your browser.', 'assistant');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.querySelector('.voice-btn i').className = 'fas fa-microphone';
        } else {
            this.recognition.start();
            this.isListening = true;
            document.querySelector('.voice-btn i').className = 'fas fa-microphone-slash';
            this.addMessage('Listening...', 'assistant');
        }
    }

    handleVoiceCommand(command) {
        this.addMessage(command, 'user');
        
        // Handle different voice commands
        if (command.includes('open calendar')) {
            window.location.href = 'pages/calendar.html';
        } else if (command.includes('add event')) {
            // Trigger event form
            document.querySelector('.event-form').style.display = 'block';
        } else if (command.includes('show events')) {
            // Show events for current date
            const today = new Date().toISOString().split('T')[0];
            calendar.showEventsList(today);
        } else {
            this.addMessage('I heard you say: ' + command, 'assistant');
        }
    }

    handleUserInput(text) {
        if (!text.trim()) return;
        
        this.addMessage(text, 'user');
        // Add your chatbot logic here
        this.addMessage('I received your message: ' + text, 'assistant');
    }

    addMessage(text, sender) {
        const messages = document.querySelector('.messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }
}

// Initialize the assistant when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new VirtualAssistant();
});
