document.addEventListener('DOMContentLoaded', function() {
    // Progress Bar
    const progressBar = document.getElementById('progressBar');
    let totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    window.addEventListener('scroll', () => {
        let progress = (window.pageYOffset / totalHeight) * 100;
        progressBar.style.width = progress + '%';
    });

    // Sample group data
    const sampleGroups = [
        {
            name: 'Advanced Calculus',
            subject: 'Mathematics',
            members: 32,
            status: 'Active',
            description: 'Group for advanced calculus topics and problem solving'
        },
        {
            name: 'Web Development',
            subject: 'Computer Science',
            members: 45,
            status: 'Active',
            description: 'Learn and discuss web development technologies'
        },
        {
            name: 'Organic Chemistry',
            subject: 'Chemistry',
            members: 28,
            status: 'Active',
            description: 'Study group for organic chemistry concepts'
        }
    ];

    // Function to create group card
    function createGroupCard(group) {
        const card = document.createElement('div');
        card.className = 'group-card animate-in';
        card.innerHTML = `
            <h4>${group.name}</h4>
            <p class="text-muted">${group.subject}</p>
            <p>${group.description}</p>
            <div class="stats">
                <span>${group.members} Members</span>
                <span>${group.status}</span>
            </div>
            <button class="btn btn-primary mt-2">Join Group</button>
        `;
        return card;
    }

    // Add sample groups to the grid
    const cardGrid = document.querySelector('.card-grid');
    if (cardGrid) {
        sampleGroups.forEach(group => {
            cardGrid.appendChild(createGroupCard(group));
        });
    }

    // Handle group creation form
    const createGroupForm = document.getElementById('createGroupForm');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newGroup = {
                name: document.getElementById('groupName').value,
                subject: document.getElementById('subject').value,
                description: document.getElementById('description').value,
                members: 1,
                status: 'New'
            };

            cardGrid.insertBefore(createGroupCard(newGroup), cardGrid.firstChild);
            createGroupForm.reset();
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
