document.addEventListener('DOMContentLoaded', function() {
    // Progress Bar
    const progressBar = document.getElementById('progressBar');
    let totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    function updateProgressBar() {
        totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        let progress = (window.pageYOffset / totalHeight) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    window.addEventListener('scroll', updateProgressBar);
    window.addEventListener('resize', updateProgressBar);

    // Virtual Assistant
    const virtualAssistant = document.getElementById('virtualAssistant');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');

    // Enhanced responses with more natural language and helpful suggestions
    const responses = {
        'hello': ['Hi there! How can I help you with your studies today?', 'Would you like help with finding study groups or creating flashcards?'],
        'hi': ['Hello! What would you like help with?', 'I can assist you with study techniques, group formation, or resource finding.'],
        'study': [
            'Here are some effective study techniques:',
            '1. The Pomodoro Technique: 25 minutes of focused study, followed by a 5-minute break',
            '2. Active Recall: Test yourself instead of just re-reading',
            '3. Spaced Repetition: Review material at increasing intervals',
            'Would you like me to explain any of these in detail?'
        ],
        'groups': [
            'Our study groups are a great way to learn collaboratively!',
            'You can join existing groups or create your own based on your subjects.',
            'Would you like me to show you the available groups?'
        ],
        'flashcards': [
            'Flashcards are an excellent tool for memorization and quick review.',
            'You can create digital flashcard sets and study them anytime.',
            'Would you like to create a new flashcard set?'
        ],
        'help': [
            'I can help you with:',
            '• Finding or creating study groups',
            '• Creating and studying flashcards',
            '• Effective study techniques',
            '• Time management tips',
            'What would you like to know more about?'
        ],
        'default': [
            'I\'m here to help make your study experience better!',
            'You can ask me about study groups, flashcards, or study techniques.',
            'Try asking something specific like "How can I study better?" or "How do I join a group?"'
        ]
    };

    function addMessage(message, isUser = false) {
        if (Array.isArray(message)) {
            message.forEach((line, index) => {
                setTimeout(() => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'} animate-in`;
                    messageDiv.textContent = line;
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }, index * 500); // Stagger messages for natural feel
            });
        } else {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'} animate-in`;
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    window.sendMessage = function() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';

            // Process user input and find the most relevant response
            const lowercaseMessage = message.toLowerCase();
            let response = responses.default;

            for (const [key, value] of Object.entries(responses)) {
                if (lowercaseMessage.includes(key)) {
                    response = value;
                    break;
                }
            }

            // Add typing indicator
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message assistant-message typing-indicator';
            typingIndicator.textContent = '...';
            chatMessages.appendChild(typingIndicator);

            // Simulate typing delay and remove indicator before showing response
            setTimeout(() => {
                chatMessages.removeChild(typingIndicator);
                addMessage(response);
            }, 1000);
        }
    }

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Sidebar Toggle
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');
    
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            content.classList.toggle('active');
        });
    }

    // Add animation classes to elements as they come into view
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .section-title, .feature-card').forEach(element => {
        observer.observe(element);
    });

    // Interactive cards with smooth perspective effect
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        let timeoutId;
        
        card.addEventListener('mousemove', (e) => {
            if (timeoutId) clearTimeout(timeoutId);
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            }, 50);
        });

        card.addEventListener('mouseenter', () => {
            if (timeoutId) clearTimeout(timeoutId);
        });
    });

    // Initialize any tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
