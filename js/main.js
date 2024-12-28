$(document).ready(function() {
    // Initialize tooltips and popovers
    $('[data-bs-toggle="tooltip"]').tooltip();
    $('[data-bs-toggle="popover"]').popover();

    // Smooth scrolling for anchor links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        const target = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 70
        }, 800);
    });

    // Enhanced Form Validation
    function validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            errors: {
                length: password.length < minLength,
                upperCase: !hasUpperCase,
                lowerCase: !hasLowerCase,
                numbers: !hasNumbers,
                specialChar: !hasSpecialChar
            }
        };
    }

    // Password strength indicator
    $('#password').on('input', function() {
        const password = $(this).val();
        const validation = validatePassword(password);
        let strength = 0;
        
        // Update password strength meter
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        const strengthClass = ['bg-danger', 'bg-warning', 'bg-info', 'bg-primary', 'bg-success'][strength - 1];
        $('#passwordStrength')
            .removeClass('bg-danger bg-warning bg-info bg-primary bg-success')
            .addClass(strengthClass)
            .css('width', (strength * 20) + '%');
    });

    // Registration form handling with enhanced security
    $('#registrationForm').on('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();
        const email = $('#email').val();
        
        // Reset previous error states
        $('.form-control').removeClass('is-invalid');
        $('.invalid-feedback').remove();

        // Enhanced password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            let errorMessage = 'Password must contain: ';
            if (passwordValidation.errors.length) errorMessage += '8+ characters, ';
            if (passwordValidation.errors.upperCase) errorMessage += 'uppercase letter, ';
            if (passwordValidation.errors.lowerCase) errorMessage += 'lowercase letter, ';
            if (passwordValidation.errors.numbers) errorMessage += 'number, ';
            if (passwordValidation.errors.specialChar) errorMessage += 'special character, ';
            
            $('#password').addClass('is-invalid')
                .after(`<div class="invalid-feedback">${errorMessage.slice(0, -2)}</div>`);
            isValid = false;
        }

        // Password match validation
        if (password !== confirmPassword) {
            $('#confirmPassword').addClass('is-invalid')
                .after('<div class="invalid-feedback">Passwords do not match</div>');
            isValid = false;
        }

        // Email validation with regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            $('#email').addClass('is-invalid')
                .after('<div class="invalid-feedback">Please enter a valid email address</div>');
            isValid = false;
        }

        if (isValid) {
            // Show loading state
            const submitBtn = $(this).find('button[type="submit"]');
            const originalText = submitBtn.html();
            submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Loading...')
                .prop('disabled', true);

            // Simulate API call (replace with actual API call)
            setTimeout(() => {
                // Success message with enhanced animation
                $('.registration-card .card-body').html(`
                    <div class="text-center py-5">
                        <div class="success-checkmark">
                            <div class="check-icon">
                                <span class="icon-line line-tip"></span>
                                <span class="icon-line line-long"></span>
                                <div class="icon-circle"></div>
                                <div class="icon-fix"></div>
                            </div>
                        </div>
                        <h3 class="mb-4 slide-in-right">Registration Successful!</h3>
                        <p class="mb-4 slide-in-left">Thank you for joining StudyZone. Check your email for verification.</p>
                        <a href="../index.html" class="btn btn-primary btn-lg hover-lift">Return to Home</a>
                    </div>
                `);
            }, 2000);
        }
    });

    // Login form handling
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();

        // Basic validation
        if (!email || !password) {
            isValid = false;
            if (!email) {
                $('#loginEmail').addClass('is-invalid')
                    .after('<div class="invalid-feedback">Email is required</div>');
            }
            if (!password) {
                $('#loginPassword').addClass('is-invalid')
                    .after('<div class="invalid-feedback">Password is required</div>');
            }
        }

        if (isValid) {
            // Show loading state
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Signing in...')
                .prop('disabled', true);

            // Simulate login (replace with actual authentication)
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        }
    });

    // Teacher Dashboard Animations
    if ($('.teacher-portal').length) {
        // Animate counters
        $('.counter').each(function() {
            const $this = $(this);
            const countTo = parseInt($this.text());
            
            $({ countNum: 0 }).animate({
                countNum: countTo
            }, {
                duration: 2000,
                easing: 'swing',
                step: function() {
                    $this.text(Math.floor(this.countNum));
                },
                complete: function() {
                    $this.text(this.countNum);
                }
            });
        });

        // Activity list animations
        $('.activity-item').each(function(index) {
            $(this).css({
                'animation-delay': (index * 0.1) + 's'
            }).addClass('slide-in-right');
        });
    }

    // Enhanced chat functionality
    const chatMessages = $('#chatMessages');
    const chatInput = $('#chatInput');
    const chatContainer = $('.chat-container');

    // Toggle chat
    $('.assistant-header').click(function() {
        chatContainer.slideToggle(300);
        if (!chatContainer.hasClass('initialized')) {
            addMessage("Hi! I'm your study assistant. How can I help you today?", false);
            chatContainer.addClass('initialized');
        }
    });

    function addMessage(message, isUser = false) {
        const messageClass = isUser ? 'user-message' : 'assistant-message';
        const messageHtml = `
            <div class="message ${messageClass} animate-in">
                <div class="message-content">
                    ${message}
                </div>
            </div>
        `;
        chatMessages.append(messageHtml);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Enhanced chat responses
    const responses = {
        'hello': ["Hi there! How can I help you with your studies today?", "Hello! Ready to learn something new?"],
        'help': ["I can help you with finding study groups, creating flashcards, or scheduling study sessions. What would you like to do?"],
        'study groups': ["You can find or create study groups in the Study Groups section. Would you like me to show you how?"],
        'flashcards': ["Our flashcard system helps you memorize effectively. You can create your own or use existing sets. Want to try it out?"]
    };

    $('#chatForm').on('submit', function(e) {
        e.preventDefault();
        const message = chatInput.val().trim().toLowerCase();
        if (message) {
            addMessage(message, true);
            chatInput.val('');

            // Simulate typing
            setTimeout(() => {
                const possibleResponses = responses[message] || ["I'm not sure about that. Could you try asking something else?"];
                const response = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
                addMessage(response);
            }, 1000);
        }
    });

    // Add floating animation to cards
    $('.floating-card').addClass('float-shadow');

    // Add ripple effect to buttons
    $('.btn-primary').addClass('ripple-effect');

    // Add glow effect to important elements
    $('.card-header').addClass('glow-effect');

    // Study interests multi-select enhancement
    $('#studyInterests').select2({
        placeholder: 'Select your interests',
        maximumSelectionLength: 5,
        theme: 'bootstrap-5'
    });

    // Progress bar update on scroll
    $(window).scroll(function() {
        const scrollPercent = ($(window).scrollTop() / ($(document).height() - $(window).height())) * 100;
        $('#progressBar').css('width', scrollPercent + '%');
    });

    // Add hover effect to cards
    $('.card').hover(
        function() { $(this).addClass('hover-lift'); },
        function() { $(this).removeClass('hover-lift'); }
    );

    // Animate elements when they come into view
    const animateOnScroll = () => {
        $('.animate-on-scroll').each(function() {
            if (isElementInViewport(this) && !$(this).hasClass('animated')) {
                $(this).addClass('animated fadeInUp');
            }
        });
    };

    // Run on scroll and load
    $(window).on('scroll load', animateOnScroll);

    // Helper function to check if element is in viewport
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Helper function to validate email
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Virtual Assistant Chat
    const chatMessages = $('#chatMessages');
    const chatInput = $('#chatInput');

    $('#virtualAssistant').on('click', '.assistant-header', function() {
        $(this).siblings('.chat-container').slideToggle(300);
    });

    function addMessage(message, isUser = false) {
        const messageClass = isUser ? 'user-message' : 'assistant-message';
        const messageHtml = `
            <div class="message ${messageClass} animate-in">
                <div class="message-content">
                    ${message}
                </div>
            </div>
        `;
        chatMessages.append(messageHtml);
        chatMessages.scrollTop(chatMessages[0].scrollHeight);
    }

    // Example responses
    const responses = {
        'hello': 'Hi there! How can I help you with your studies today?',
        'help': 'I can help you with finding study groups, creating flashcards, or scheduling study sessions. What would you like to do?',
        'study groups': 'You can find or create study groups in the Study Groups section. Would you like me to show you how?',
        'flashcards': 'Our flashcard system helps you memorize effectively. You can create your own or use existing sets. Want to try it out?'
    };

    $('#chatForm').on('submit', function(e) {
        e.preventDefault();
        const message = chatInput.val().trim().toLowerCase();
        if (message) {
            addMessage(message, true);
            chatInput.val('');

            // Simulate typing
            setTimeout(() => {
                const response = responses[message] || "I'm not sure about that. Could you try asking something else?";
                addMessage(response);
            }, 1000);
        }
    });
});
