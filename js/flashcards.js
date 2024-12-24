document.addEventListener('DOMContentLoaded', function() {
    // Progress Bar
    const progressBar = document.getElementById('progressBar');
    let totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    window.addEventListener('scroll', () => {
        let progress = (window.pageYOffset / totalHeight) * 100;
        progressBar.style.width = progress + '%';
    });

    // Sample flashcard sets
    const sampleSets = [
        {
            name: 'Basic Math Concepts',
            subject: 'Mathematics',
            cards: [
                { question: 'What is 2 + 2?', answer: '4' },
                { question: 'What is 5 x 5?', answer: '25' }
            ]
        },
        {
            name: 'Chemistry Formulas',
            subject: 'Chemistry',
            cards: [
                { question: 'What is the formula for water?', answer: 'H2O' },
                { question: 'What is the formula for glucose?', answer: 'C6H12O6' }
            ]
        }
    ];

    // Function to create flashcard set card
    function createSetCard(set) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card hover-lift">
                <div class="card-body">
                    <h5 class="card-title">${set.name}</h5>
                    <p class="card-text">${set.subject}</p>
                    <p class="card-text"><small class="text-muted">${set.cards.length} cards</small></p>
                    <button class="btn btn-primary study-btn" data-set-name="${set.name}">Study Now</button>
                </div>
            </div>
        `;
        return col;
    }

    // Add sample sets to the container
    const flashcardSets = document.getElementById('flashcardSets');
    if (flashcardSets) {
        sampleSets.forEach(set => {
            flashcardSets.appendChild(createSetCard(set));
        });
    }

    // Handle flashcard set creation
    const createFlashcardSetForm = document.getElementById('createFlashcardSetForm');
    if (createFlashcardSetForm) {
        createFlashcardSetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newSet = {
                name: document.getElementById('setName').value,
                subject: document.getElementById('subject').value,
                cards: []
            };

            flashcardSets.insertBefore(createSetCard(newSet), flashcardSets.firstChild);
            createFlashcardSetForm.reset();
        });
    }

    // Study Mode functionality
    let currentSet = null;
    let currentCardIndex = 0;
    let isShowingAnswer = false;

    function updateFlashcard() {
        const container = document.querySelector('.flashcard-container');
        if (!container || !currentSet) return;

        const card = currentSet.cards[currentCardIndex];
        container.innerHTML = `
            <div class="flashcard ${isShowingAnswer ? 'flipped' : ''}">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <h3>${card.question}</h3>
                    </div>
                    <div class="flashcard-back">
                        <h3>${card.answer}</h3>
                    </div>
                </div>
            </div>
        `;
    }

    // Event listeners for study mode
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('study-btn')) {
            const setName = e.target.dataset.setName;
            currentSet = sampleSets.find(set => set.name === setName);
            currentCardIndex = 0;
            isShowingAnswer = false;
            updateFlashcard();
            new bootstrap.Modal(document.getElementById('studyModeModal')).show();
        }
    });

    const flipCard = document.getElementById('flipCard');
    if (flipCard) {
        flipCard.addEventListener('click', () => {
            isShowingAnswer = !isShowingAnswer;
            updateFlashcard();
        });
    }

    const nextCard = document.getElementById('nextCard');
    if (nextCard) {
        nextCard.addEventListener('click', () => {
            if (!currentSet) return;
            currentCardIndex = (currentCardIndex + 1) % currentSet.cards.length;
            isShowingAnswer = false;
            updateFlashcard();
        });
    }

    const prevCard = document.getElementById('prevCard');
    if (prevCard) {
        prevCard.addEventListener('click', () => {
            if (!currentSet) return;
            currentCardIndex = (currentCardIndex - 1 + currentSet.cards.length) % currentSet.cards.length;
            isShowingAnswer = false;
            updateFlashcard();
        });
    }

    // Sidebar Toggle
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});
