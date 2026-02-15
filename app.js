class Timer {
    constructor(duration, displayElement, progressElement, labelElement) {
        this.duration = duration; // in seconds
        this.timeLeft = duration;
        this.displayElement = displayElement;
        this.progressElement = progressElement;
        this.labelElement = labelElement;
        this.timerId = null;
        this.isRunning = false;

        // Circular progress setup
        this.circle = progressElement.querySelector('.progress-ring__circle');
        this.radius = this.circle.r.baseVal.value;
        this.circumference = 2 * Math.PI * this.radius;

        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.circle.style.strokeDashoffset = this.circumference;

        this.updateDisplay();
        this.setProgress(100);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.labelElement.textContent = "Focusing...";
            this.startTime = Date.now() - (this.duration - this.timeLeft) * 1000;
            this.timerId = requestAnimationFrame(this.tick.bind(this));

            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.labelElement.textContent = "Paused";
            cancelAnimationFrame(this.timerId);

            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.duration;
        this.labelElement.textContent = "Focus";
        this.updateDisplay();
        this.setProgress(100);

        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    }

    tick() {
        if (this.isRunning) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.timeLeft = Math.max(0, this.duration - elapsed);

            this.updateDisplay();

            const progressPercent = (this.timeLeft / this.duration) * 100;
            this.setProgress(progressPercent);

            if (this.timeLeft <= 0) {
                this.complete();
            } else {
                this.timerId = requestAnimationFrame(this.tick.bind(this));
            }
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = Math.floor(this.timeLeft % 60);
        this.displayElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${minutes}:${seconds.toString().padStart(2, '0')} - Focus`;
    }

    setProgress(percent) {
        const offset = this.circumference - (percent / 100) * this.circumference;
        this.circle.style.strokeDashoffset = offset;
    }

    complete() {
        this.pause();
        this.labelElement.textContent = "Break Time!";
        this.playSound();
        // Reset or switch to break mode logic could go here
        this.timeLeft = this.duration; // Auto reset for now
        document.getElementById('start-btn').disabled = false;
    }

    playSound() {
        // Simple oscillator beep
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
    }
}

class TaskManager {
    constructor(listElement, inputElement, addButton) {
        this.listElement = listElement;
        this.inputElement = inputElement;
        this.addButton = addButton;
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        this.render();
        this.addEventListeners();
    }

    addEventListeners() {
        this.addButton.addEventListener('click', () => this.addTask());
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
    }

    addTask() {
        const text = this.inputElement.value.trim();
        if (text) {
            const task = {
                id: Date.now(),
                text: text,
                completed: false
            };
            this.tasks.push(task);
            this.save();
            this.render();
            this.inputElement.value = '';
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.save();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    render() {
        this.listElement.innerHTML = '';
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const span = document.createElement('span');
            span.className = 'task-text';
            span.textContent = task.text;

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.innerHTML = '&times;';
            delBtn.addEventListener('click', () => this.deleteTask(task.id));

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(delBtn);

            this.listElement.appendChild(li);
        });
    }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Timer Setup
    const timerDisplay = document.getElementById('time-display');
    const timerLabel = document.getElementById('timer-label');
    const progressRing = document.querySelector('.progress-ring');

    // Default 25 minutes
    const timer = new Timer(25 * 60, timerDisplay, progressRing, timerLabel);

    document.getElementById('start-btn').addEventListener('click', () => timer.start());
    document.getElementById('pause-btn').addEventListener('click', () => timer.pause());
    document.getElementById('reset-btn').addEventListener('click', () => timer.reset());

    // Task Manager Setup
    const taskList = document.getElementById('task-list');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');

    new TaskManager(taskList, taskInput, addTaskBtn);

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        themeBtn.innerHTML = newTheme === 'dark'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    });
});
