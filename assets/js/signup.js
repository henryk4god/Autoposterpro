/**
 * signup.js - Signup Page Functionality
 * Handles user registration and account creation
 */

class SignupPage {
    constructor() {
        this.form = document.getElementById('signupForm');
        this.nameInput = document.getElementById('name');
        this.emailInput = document.getElementById('email');
        this.termsCheckbox = document.getElementById('agreeTerms');
        this.submitButton = document.getElementById('signupBtn');
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
        this.form.addEventListener('submit', (e) => this.handleSignup(e));
        
        // Real-time validation
        this.nameInput.addEventListener('blur', () => this.validateName());
        this.nameInput.addEventListener('input', () => this.clearError('name'));
        
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        
        this.termsCheckbox.addEventListener('change', () => this.validateTerms());
        
        // Enter key support
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.emailInput.focus();
            }
        });
        
        this.emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSignup(e);
            }
        });
    }

    async handleSignup(event) {
        event.preventDefault();
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }

        const userData = {
            name: this.nameInput.value.trim(),
            email: this.emailInput.value.trim().toLowerCase()
        };

        try {
            const result = await Auth.register(userData);
            
            if (result.success) {
                this.showNotification(
                    `Welcome to AutoPoster! Your 7-day free trial has started. Trial ends: ${new Date(result.user.trialEnd).toLocaleDateString()}`,
                    'success'
                );
                
                // Redirect to dashboard after successful signup
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Signup process error:', error);
            this.showNotification('An unexpected error occurred. Please try again.', 'error');
        }
    }

    validateForm() {
        const name = this.nameInput.value.trim();
        const email = this.emailInput.value.trim();
        const agreedToTerms = this.termsCheckbox.checked;
        
        let isValid = true;

        // Clear previous errors
        this.clearAllErrors();

        // Validate name
        if (!name) {
            this.showError('name', 'Full name is required');
            isValid = false;
        } else if (name.length < 2) {
            this.showError('name', 'Name must be at least 2 characters long');
            isValid = false;
        } else if (name.length > 100) {
            this.showError('name', 'Name must be less than 100 characters');
            isValid = false;
        }

        // Validate email
        if (!email) {
            this.showError('email', 'Email address is required');
            isValid = false;
        } else if (!Utils.isValidEmail(email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Validate terms
        if (!agreedToTerms) {
            this.showError('terms', 'You must agree to the terms and conditions');
            isValid = false;
        }

        if (!isValid) {
            this.showNotification('Please fix the errors above', 'error');
        }

        return isValid;
    }

    validateName() {
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.showError('name', 'Full name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showError('name', 'Name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.showError('name', 'Name must be less than 100 characters');
            return false;
        }
        
        this.clearError('name');
        return true;
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

    validateTerms() {
        if (!this.termsCheckbox.checked) {
            this.showError('terms', 'You must agree to the terms and conditions');
            return false;
        }
        
        this.clearError('terms');
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
        this.clearError('name');
        this.clearError('email');
        this.clearError('terms');
        this.hideNotification();
    }

    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.remove('hidden');
        
        // Auto-hide success messages after longer duration
        if (type === 'success') {
            setTimeout(() => {
                this.hideNotification();
            }, 7000);
        }
    }

    hideNotification() {
        this.notification.classList.add('hidden');
    }

    autoFillDemoData() {
        // Auto-fill with demo data for testing
        const urlParams = new URLSearchParams(window.location.search);
        const demo = urlParams.get('demo');
        
        if (demo === 'true') {
            const randomId = Math.floor(Math.random() * 1000);
            this.nameInput.value = `Demo User ${randomId}`;
            this.emailInput.value = `demo${randomId}@example.com`;
            this.termsCheckbox.checked = true;
            
            this.showNotification('Demo mode activated. Click "Start Free Trial" to continue.', 'info');
        }
    }

    checkRedirect() {
        // Redirect to dashboard if already logged in
        if (Auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }
}

// Initialize signup page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupPage();
});
