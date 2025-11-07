/**
 * api.js - API Service
 * Handles all communication with the Google Apps Script backend
 */

class ApiService {
    constructor() {
        this.baseUrl = 'https://script.google.com/macros/s/AKfycbyjlF8fcu-oXtSPB9MFgtjcRbt8BlheyqR22ADeeK0ijTsTt8oxLBiAB0GzJMzBy2fv-A/exec';
        this.apiKey = 'MySuperSecretKeyForAutoPostr2025!';
        this.cache = new Map();
        this.requestQueue = new Map();
    }

    /**
     * Make API request with error handling and retry logic
     */
    async request(endpoint, data = {}, options = {}) {
        const cacheKey = options.cacheKey || this._generateCacheKey(endpoint, data);
        const method = options.method || 'POST';
        
        // Check cache for GET requests
        if (method === 'GET' && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Debounce identical requests
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }
        
        const requestPromise = this._makeRequest(endpoint, data, method, options);
        this.requestQueue.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            
            // Cache successful GET responses
            if (method === 'GET' && options.cacheTime) {
                this.cache.set(cacheKey, result);
                setTimeout(() => {
                    this.cache.delete(cacheKey);
                }, options.cacheTime);
            }
            
            return result;
        } finally {
            this.requestQueue.delete(cacheKey);
        }
    }

    /**
     * Internal request method with retry logic
     */
    async _makeRequest(endpoint, data, method, options) {
        const maxRetries = options.retries || 3;
        const retryDelay = options.retryDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const url = `${this.baseUrl}?key=${this.apiKey}`;
                const payload = {
                    ...data,
                    action: endpoint
                };
                
                const fetchOptions = {
                    method: 'POST', // Always use POST for GAS
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    },
                    body: JSON.stringify(payload)
                };
                
                const response = await fetch(url, fetchOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const text = await response.text();
                let result;
                
                try {
                    result = JSON.parse(text);
                } catch (parseError) {
                    throw new Error('Invalid JSON response from server');
                }
                
                if (!result.success) {
                    throw new Error(result.message || 'Request failed');
                }
                
                return result;
                
            } catch (error) {
                console.error(`API Request failed (attempt ${attempt}/${maxRetries}):`, error);
                
                if (attempt === maxRetries) {
                    throw new Error(`API request failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry with exponential backoff
                await this._sleep(retryDelay * Math.pow(2, attempt - 1));
            }
        }
    }

    /**
     * User API methods
     */
    async registerUser(userData) {
        return this.request('user.register', userData);
    }

    async loginUser(email) {
        return this.request('user.login', { email });
    }

    async getUserProfile(email) {
        return this.request('user.profile', { email }, {
            method: 'GET',
            cacheKey: `profile_${email}`,
            cacheTime: 60000 // 1 minute
        });
    }

    /**
     * Token API methods
     */
    async saveToken(tokenData) {
        return this.request('token.save', tokenData);
    }

    async getUserTokens(email) {
        return this.request('token.list', { email }, {
            method: 'GET',
            cacheKey: `tokens_${email}`,
            cacheTime: 30000 // 30 seconds
        });
    }

    /**
     * Post API methods
     */
    async schedulePost(postData) {
        return this.request('post.create', postData);
    }

    async getUserPosts(email, filters = {}) {
        return this.request('post.list', { email, ...filters }, {
            method: 'GET',
            cacheKey: `posts_${email}_${JSON.stringify(filters)}`,
            cacheTime: 30000 // 30 seconds
        });
    }

    async getUserStats(email) {
        return this.request('post.stats', { email }, {
            method: 'GET',
            cacheKey: `stats_${email}`,
            cacheTime: 30000 // 30 seconds
        });
    }

    /**
     * Utility methods
     */
    _generateCacheKey(endpoint, data) {
        return `${endpoint}_${JSON.stringify(data)}`;
    }

    async _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear cache for specific user
     */
    clearUserCache(email) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(email)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get API status
     */
    async getStatus() {
        try {
            const response = await fetch(this.baseUrl);
            const text = await response.text();
            return { online: true, response: text };
        } catch (error) {
            return { online: false, error: error.message };
        }
    }
}

// Global API instance
const API = new ApiService();

// Request interceptor for adding auth headers
const originalRequest = API.request.bind(API);
API.request = async function(endpoint, data, options) {
    // Add user email to all requests if available
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail && !data.email) {
        data.email = userEmail;
    }
    
    return originalRequest(endpoint, data, options);
};

// Response interceptor for handling common errors
API._makeRequest = async function(...args) {
    try {
        return await originalRequest._makeRequest.apply(this, args);
    } catch (error) {
        // Handle specific error cases
        if (error.message.includes('Failed to fetch')) {
            Utils.showNotification('Network error: Please check your internet connection', 'error');
        } else if (error.message.includes('Invalid JSON')) {
            Utils.showNotification('Server error: Please try again later', 'error');
        } else if (error.message.includes('API request failed')) {
            Utils.showNotification('Service temporarily unavailable', 'error');
        }
        
        throw error;
    }
};
