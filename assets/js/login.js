/**
 * login.js - Login Page Functionality
 * Handles user authentication and login process
 */

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.submitButton = document.getElementById('loginBtn');
        this.notification = document.getElementById('notification');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.autoFillDemoData();
        this.checkRedirect();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Real-time validation
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        
        // Enter key support
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin(e);
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }

        const email = this.emailInput.value.trim().toLowerCase();
        
        try {
            const result = await Auth.login(email);
            
            if (result.success) {
                // Redirect to dashboard after successful login
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Login process error:', error);
            this.showNotification('An unexpected error occurred. Please try again.', 'error');
        }
    }

    validateForm() {
        const email = this.emailInput.value.trim();
        let isValid = true;

        // Clear previous errors
        this.clearAllErrors();

        // Validate email
        if (!email) {
            this.showError('email', 'Email address is required');
            isValid = false;
        } else if (!Utils.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (!isValid) {
            this.showNotification('Please fix the errors above', 'error');
        }

        return isValid;
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showError('email', 'Email address is required');
            return false;
        }
        
        if (!Utils.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearError('email');
        return true;
    }

    showError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        // Add error styling to input
        const inputElement = document.getElementById(field);
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    clearError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        const inputElement = document.getElementById(field);
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }

    clearAllErrors() {
        this.clearError('email');
        this.hideNotification();
    }

    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.remove('hidden');
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        }
    }

    hideNotification() {
        this.notification.classList.add('hidden');
    }

    autoFillDemoData() {
        // Auto-fill with demo email for testing
        const urlParams = new URLSearchParams(window.location.search);
        const demo = urlParams.get('demo');
        
        if (demo === 'true') {
            this.emailInput.value = `demo${Math.floor(Math.random() * 1000)}@example.com`;
            this.showNotification('Demo mode activated. You can use any email to login.', 'info');
        }
        
        // Pre-fill from localStorage if available
        const lastEmail = localStorage.getItem('lastLoginEmail');
        if (lastEmail && !this.emailInput.value) {
            this.emailInput.value = lastEmail;
        }
    }

    checkRedirect() {
        // Redirect to dashboard if already logged in
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Add error styling to CSS
const errorStyles = `
.form-input.error {
    border-color: var(--error-500);
    box-shadow: 0 0 0 3px rgb(239 68 68 / 0.1);
}

.form-input.error:focus {
    border-color: var(--error-500);
    box-shadow: 0 0 0 3px rgb(239 68 68 / 0.1);
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);

// Initialize login page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
