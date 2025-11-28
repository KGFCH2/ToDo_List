// loader.js - Reusable To-Do List Themed Loader Component

class TodoLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.loader = null;
        this.init();
    }

    init() {
        if (!this.container) return;
        
        // Create loader element
        this.loader = document.createElement('div');
        this.loader.className = 'todo-loader';
        this.loader.innerHTML = `
            <div class="todo-loader-content">
                <div class="todo-loader-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                </div>
                <div class="todo-loader-items">
                    <div class="todo-loader-item">
                        <div class="todo-checkbox"></div>
                        <div class="todo-line"></div>
                    </div>
                    <div class="todo-loader-item">
                        <div class="todo-checkbox"></div>
                        <div class="todo-line"></div>
                    </div>
                    <div class="todo-loader-item">
                        <div class="todo-checkbox"></div>
                        <div class="todo-line"></div>
                    </div>
                </div>
                <div class="todo-loader-text">Loading...</div>
            </div>
        `;
        
        this.loader.style.display = 'none';
        this.container.appendChild(this.loader);
    }

    show() {
        if (this.loader) {
            this.loader.style.display = 'flex';
            // Trigger animation
            setTimeout(() => {
                this.loader.classList.add('active');
            }, 10);
        }
    }

    hide() {
        if (this.loader) {
            this.loader.classList.remove('active');
            setTimeout(() => {
                this.loader.style.display = 'none';
            }, 300);
        }
    }

    setMessage(message) {
        if (this.loader) {
            const textElement = this.loader.querySelector('.todo-loader-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }
}

// Global loader instances
const loaders = {
    home: null,
    tasks: null,
    analytics: null,
    settings: null
};

// Initialize loaders when DOM is ready
function initializeLoaders() {
    loaders.home = new TodoLoader('page-home');
    loaders.tasks = new TodoLoader('page-tasks');
    loaders.analytics = new TodoLoader('page-analytics');
    loaders.settings = new TodoLoader('page-settings');
}

// Helper functions for showing/hiding loaders
function showLoader(section, message = 'Loading...') {
    if (loaders[section]) {
        loaders[section].setMessage(message);
        loaders[section].show();
    }
}

function hideLoader(section) {
    if (loaders[section]) {
        loaders[section].hide();
    }
}

function showAllLoaders(message = 'Loading...') {
    Object.keys(loaders).forEach(section => {
        showLoader(section, message);
    });
}

function hideAllLoaders() {
    Object.keys(loaders).forEach(section => {
        hideLoader(section);
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TodoLoader, showLoader, hideLoader, showAllLoaders, hideAllLoaders };
}
