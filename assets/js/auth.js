/**
 * auth.js - Authentication Utilities
 * Handles user authentication state and session management
 */

class AuthService {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.init();
    }

    /**
     * Initialize authentication state
     */
    init() {
        this._loadUserFromStorage();
        this._checkSessionExpiry();
        this._setupAutoRefresh();
    }

    /**
     * User login
     */
    async login(email) {
        try {
            Utils.showLoading(document.getElementById('loginBtn'));
            
            const result = await API.loginUser(email);
            
            if (result.success) {
                this._setUserSession(result.user);
                Utils.showNotification('Login successful!', 'success');
                return { success: true, user: result.user };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            Utils.hideLoading(document.getElementById('loginBtn'));
        }
    }

    /**
     * User registration
     */
    async register(userData) {
        try {
            Utils.showLoading(document.getElementById('signupBtn'));
            
            const result = await API.registerUser(userData);
            
            if (result.success) {
                this._setUserSession(result.user);
                Utils.showNotification('Registration successful! Welcome to AutoPostr.', 'success');
                return { success: true, user: result.user };
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            Utils.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            Utils.hideLoading(document.getElementById('signupBtn'));
        }
    }

    /**
     * User logout
     */
    logout() {
        this.currentUser = null;
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        localStorage.removeItem('sessionExpiry');
        
        API.clearCache();
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser && !this._isSessionExpired();
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Require authentication for protected routes
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.logout();
            return false;
        }
        return true;
    }

    /**
     * Refresh user data
     */
    async refreshUserData() {
        if (!this.currentUser) return;
        
        try {
            const result = await API.getUserProfile(this.currentUser.email);
            if (result.success) {
                this._setUserSession(result.profile.user);
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    }

    /**
     * Internal methods
     */
    _setUserSession(user) {
        this.currentUser = user;
        const expiry = Date.now() + this.sessionTimeout;
        
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('sessionExpiry', expiry.toString());
    }

    _loadUserFromStorage() {
        const userEmail = localStorage.getItem('userEmail');
        const userData = localStorage.getItem('userData');
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        
        if (userEmail && userData && sessionExpiry) {
            this.currentUser = JSON.parse(userData);
        }
    }

    _isSessionExpired() {
        const expiry = localStorage.getItem('sessionExpiry');
        if (!expiry) return true;
        
        return Date.now() > parseInt(expiry);
    }

    _checkSessionExpiry() {
        if (this._isSessionExpired() && this.currentUser) {
            Utils.showNotification('Your session has expired. Please login again.', 'warning');
            this.logout();
        }
    }

    _setupAutoRefresh() {
        // Refresh user data every 5 minutes
        setInterval(() => {
            if (this.isAuthenticated()) {
                this.refreshUserData();
            }
        }, 5 * 60 * 1000);
        
        // Check session expiry every minute
        setInterval(() => {
            this._checkSessionExpiry();
        }, 60 * 1000);
    }
}

// Global auth instance
const Auth = new AuthService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
