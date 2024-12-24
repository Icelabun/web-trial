class Calendar {
    constructor(container) {
        this.container = container;
        this.date = new Date();
        this.selectedDate = null;
        this.events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const firstDayIndex = firstDay.getDay();
        const lastDayIndex = lastDay.getDate();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                          'August', 'September', 'October', 'November', 'December'];

        let html = `
            <div class="calendar-navigation">
                <div class="year-select">
                    <button class="btn prev-year"><i class="fas fa-chevron-left"></i></button>
                    <select class="year-dropdown">
                        ${this.generateYearOptions(year)}
                    </select>
                    <button class="btn next-year"><i class="fas fa-chevron-right"></i></button>
                </div>
                <div class="month-select">
                    <button class="btn prev-month"><i class="fas fa-chevron-left"></i></button>
                    <select class="month-dropdown">
                        ${monthNames.map((month, index) => 
                            `<option value="${index}" ${this.date.getMonth() === index ? 'selected' : ''}>${month}</option>`
                        ).join('')}
                    </select>
                    <button class="btn next-month"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-body">
                <div class="weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div class="days">`;

        for (let i = 0; i < firstDayIndex; i++) {
            html += '<div class="day empty"></div>';
        }

        for (let day = 1; day <= lastDayIndex; day++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const hasEvents = this.events[dateStr] && this.events[dateStr].length > 0;
            const isSelected = this.selectedDate === dateStr;
            const isToday = this.isToday(year, month, day);
            
            html += `
                <div class="day ${hasEvents ? 'has-events' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}">
                    ${day}
                    ${hasEvents ? '<div class="event-dot"></div>' : ''}
                </div>`;
        }

        html += `
                </div>
            </div>
            <div class="event-form glass-card" style="display: none;">
                <h3>Add Event</h3>
                <form id="eventForm">
                    <input type="text" id="eventTitle" placeholder="Event Title" required>
                    <input type="time" id="eventTime" required>
                    <textarea id="eventDescription" placeholder="Event Description"></textarea>
                    <button type="submit" class="btn btn-primary">Save Event</button>
                </form>
            </div>
            <div class="events-list glass-card" style="display: none;">
                <h3>Events</h3>
                <div id="eventsList"></div>
            </div>`;

        this.container.innerHTML = html;
    }

    generateYearOptions(currentYear) {
        let html = '';
        const startYear = currentYear - 100;
        const endYear = currentYear + 100;
        
        for (let year = startYear; year <= endYear; year++) {
            html += `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }
        
        return html;
    }

    isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    }

    attachEventListeners() {
        // Year navigation
        this.container.querySelector('.prev-year').addEventListener('click', () => {
            this.date.setFullYear(this.date.getFullYear() - 1);
            this.render();
        });

        this.container.querySelector('.next-year').addEventListener('click', () => {
            this.date.setFullYear(this.date.getFullYear() + 1);
            this.render();
        });

        this.container.querySelector('.year-dropdown').addEventListener('change', (e) => {
            this.date.setFullYear(parseInt(e.target.value));
            this.render();
        });

        // Month navigation
        this.container.querySelector('.prev-month').addEventListener('click', () => {
            this.date.setMonth(this.date.getMonth() - 1);
            this.render();
        });

        this.container.querySelector('.next-month').addEventListener('click', () => {
            this.date.setMonth(this.date.getMonth() + 1);
            this.render();
        });

        this.container.querySelector('.month-dropdown').addEventListener('change', (e) => {
            this.date.setMonth(parseInt(e.target.value));
            this.render();
        });

        // Day selection
        this.container.querySelectorAll('.day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.target.closest('.day').dataset.date;
                this.selectedDate = date;
                this.showEventForm(date);
                this.showEventsList(date);
                this.render();
            });
        });

        // Event form
        const eventForm = this.container.querySelector('#eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEvent();
            });
        }
    }

    showEventForm(date) {
        const form = this.container.querySelector('.event-form');
        form.style.display = 'block';
    }

    showEventsList(date) {
        const eventsList = this.container.querySelector('.events-list');
        const eventsListContainer = this.container.querySelector('#eventsList');
        
        if (this.events[date] && this.events[date].length > 0) {
            let html = '';
            this.events[date].forEach((event, index) => {
                html += `
                    <div class="event-item">
                        <div class="event-time">${event.time}</div>
                        <div class="event-title">${event.title}</div>
                        <div class="event-description">${event.description}</div>
                        <button class="btn btn-danger btn-sm" onclick="calendar.deleteEvent('${date}', ${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>`;
            });
            eventsListContainer.innerHTML = html;
            eventsList.style.display = 'block';
        } else {
            eventsListContainer.innerHTML = '<p>No events scheduled for this day.</p>';
            eventsList.style.display = 'block';
        }
    }

    saveEvent() {
        const title = this.container.querySelector('#eventTitle').value;
        const time = this.container.querySelector('#eventTime').value;
        const description = this.container.querySelector('#eventDescription').value;

        if (!this.events[this.selectedDate]) {
            this.events[this.selectedDate] = [];
        }

        this.events[this.selectedDate].push({
            title,
            time,
            description
        });

        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        
        this.container.querySelector('#eventForm').reset();
        this.showEventsList(this.selectedDate);
        this.render();
    }

    deleteEvent(date, index) {
        this.events[date].splice(index, 1);
        if (this.events[date].length === 0) {
            delete this.events[date];
        }
        localStorage.setItem('calendarEvents', JSON.stringify(this.events));
        this.showEventsList(date);
        this.render();
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendar = new Calendar(document.getElementById('calendar'));
});
