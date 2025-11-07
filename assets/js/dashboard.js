/**
 * dashboard.js - Dashboard Functionality
 * Main dashboard controller with all section management
 */

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'overview';
        this.userStats = null;
        this.posts = [];
        this.tokens = [];
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!Auth.requireAuth()) {
            return;
        }

        this.currentUser = Auth.getCurrentUser();
        this.bindEvents();
        await this.loadInitialData();
        this.showSection('overview');
        this.updateUserInfo();
    }

    bindEvents() {
        // Navigation
        this.bindNavigation();
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
        });
        
        // Quick actions
        this.bindQuickActions();
        
        // Form submissions
        this.bindForms();
        
        // Real-time updates
        this.bindRealTimeUpdates();
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    bindQuickActions() {
        const actionCards = document.querySelectorAll('.action-card');
        
        actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const section = card.dataset.section;
                if (section) {
                    this.showSection(section);
                    
                    // Update navigation
                    const navItem = document.querySelector(`[data-section="${section}"]`);
                    if (navItem) {
                        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                        navItem.classList.add('active');
                    }
                }
            });
        });
    }

    bindForms() {
        // Schedule form
        const scheduleForm = document.getElementById('scheduleForm');
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', (e) => this.handleSchedulePost(e));
        }
        
        // Connection form
        const connectionForm = document.getElementById('connectionForm');
        if (connectionForm) {
            connectionForm.addEventListener('submit', (e) => this.handleConnectPlatform(e));
        }
        
        // Platform selection change
        const platformSelect = document.getElementById('connectPlatform');
        if (platformSelect) {
            platformSelect.addEventListener('change', (e) => this.handlePlatformChange(e));
        }
        
        // Preview button
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.updatePostPreview());
        }
        
        // Character count for message
        const messageInput = document.getElementById('message');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.updateCharCount());
        }
    }

    bindRealTimeUpdates() {
        // Auto-refresh data every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'overview') {
                this.loadOverviewData();
            }
        }, 30000);
        
        // Update relative times every minute
        setInterval(() => {
            this.updateRelativeTimes();
        }, 60000);
    }

    async loadInitialData() {
        try {
            Utils.showLoading();
            
            await Promise.all([
                this.loadOverviewData(),
                this.loadUserTokens(),
                this.loadUserPosts()
            ]);
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            Utils.showNotification('Failed to load dashboard data', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    async loadOverviewData() {
        try {
            const result = await API.getUserStats(this.currentUser.email);
            
            if (result.success) {
                this.userStats = result.stats;
                this.updateOverviewStats();
                this.updateRecentActivity();
            }
        } catch (error) {
            console.error('Failed to load overview data:', error);
        }
    }

    async loadUserTokens() {
        try {
            const result = await API.getUserTokens(this.currentUser.email);
            
            if (result.success) {
                this.tokens = result.tokens;
                this.updatePlatformsList();
            }
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
    }

    async loadUserPosts() {
        try {
            const result = await API.getUserPosts(this.currentUser.email, { limit: 50 });
            
            if (result.success) {
                this.posts = result.posts;
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Section-specific initialization
            this.initializeSection(sectionName);
        }
    }

    initializeSection(sectionName) {
        switch (sectionName) {
            case 'overview':
                this.updateOverviewStats();
                break;
            case 'platforms':
                this.updatePlatformsList();
                break;
            case 'schedule':
                this.initializeScheduleForm();
                break;
            case 'posts':
                this.initializePostsList();
                break;
        }
    }

    updateUserInfo() {
        // Update user email
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }
        
        // Update user plan badge
        const userPlanElement = document.getElementById('userPlan');
        if (userPlanElement) {
            userPlanElement.textContent = this.currentUser.plan.charAt(0).toUpperCase() + this.currentUser.plan.slice(1);
            userPlanElement.className = `badge ${this.currentUser.plan}`;
        }
        
        // Update form emails
        const formEmails = document.querySelectorAll('input[type="email"][readonly]');
        formEmails.forEach(input => {
            input.value = this.currentUser.email;
        });
    }

    updateOverviewStats() {
        if (!this.userStats) return;
        
        // Update stat cards
        this.updateStatCard('totalPosts', this.userStats.overview.total);
        this.updateStatCard('successRate', `${this.userStats.overview.successRate}%`);
        this.updateStatCard('pendingPosts', this.userStats.overview.pending);
        this.updateStatCard('connectedPlatforms', this.userStats.overview.connectedPlatforms);
    }

    updateStatCard(statId, value) {
        const element = document.getElementById(statId);
        if (element) {
            // Animate number change
            this.animateValue(element, 0, value, 1000);
        }
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            element.textContent = Number.isInteger(endValue) ? 
                Math.floor(currentValue) : currentValue.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    updateRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        if (!activityList || !this.posts) return;
        
        const recentPosts = this.posts.slice(0, 10);
        
        if (recentPosts.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-content">
                        <div class="activity-title">No recent activity</div>
                        <div class="activity-description">Your scheduled posts will appear here</div>
                    </div>
                </div>
            `;
            return;
        }
        
        activityList.innerHTML = recentPosts.map(post => `
            <div class="activity-item">
                <div class="activity-icon ${post.status === 'posted' ? 'success' : post.status === 'failed' ? 'error' : 'warning'}">
                    ${post.status === 'posted' ? '✓' : post.status === 'failed' ? '✗' : '⏳'}
                </div>
                <div class="activity-content">
                    <div class="activity-title">
                        ${Utils.getPlatformDisplayName(post.platform)} Post
                    </div>
                    <div class="activity-description">
                        ${Utils.truncateText(post.message, 60)}
                    </div>
                </div>
                <div class="activity-time">
                    ${Utils.formatRelativeTime(post.scheduled_time)}
                </div>
            </div>
        `).join('');
    }

    updatePlatformsList() {
        const platformsList = document.getElementById('platformsList');
        if (!platformsList) return;
        
        if (this.tokens.length === 0) {
            platformsList.innerHTML = `
                <div class="platform-card">
                    <div class="platform-header">
                        <div class="platform-icon">🔗</div>
                        <div class="platform-name">No platforms connected</div>
                    </div>
                    <div class="platform-details">
                        <p>Connect your first platform to start scheduling posts</p>
                    </div>
                </div>
            `;
            return;
        }
        
        platformsList.innerHTML = this.tokens.map(token => `
            <div class="platform-card">
                <div class="platform-header">
                    <div class="platform-icon">${Utils.getPlatformIcon(token.platform)}</div>
                    <div class="platform-name">${Utils.getPlatformDisplayName(token.platform)}</div>
                    <div class="platform-status">
                        <span class="badge success">Connected</span>
                    </div>
                </div>
                <div class="platform-details">
                    <p><strong>Connected:</strong> ${Utils.formatRelativeTime(token.connected_at)}</p>
                    <p><strong>Last used:</strong> ${Utils.formatRelativeTime(token.last_used)}</p>
                </div>
                <div class="platform-actions">
                    <button class="btn btn-text btn-small" onclick="dashboard.reconnectPlatform('${token.platform}')">
                        Reconnect
                    </button>
                    <button class="btn btn-text btn-small" onclick="dashboard.disconnectPlatform('${token.platform}')">
                        Disconnect
                    </button>
                </div>
            </div>
        `).join('');
    }

    initializeScheduleForm() {
        // Set minimum datetime to current time
        const scheduleTimeInput = document.getElementById('scheduleTime');
        if (scheduleTimeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 10); // Minimum 10 minutes from now
            scheduleTimeInput.min = now.toISOString().slice(0, 16);
            
            // Set default to 1 hour from now
            const defaultTime = new Date(now.getTime() + 60 * 60 * 1000);
            scheduleTimeInput.value = defaultTime.toISOString().slice(0, 16);
        }
        
        // Update platform options based on connected platforms
        this.updatePlatformOptions();
    }

    updatePlatformOptions() {
        const platformSelect = document.getElementById('platform');
        const schedulePlatformSelect = document.getElementById('schedulePlatform');
        
        if (!platformSelect && !schedulePlatformSelect) return;
        
        const selects = [platformSelect, schedulePlatformSelect].filter(select => select);
        const connectedPlatforms = this.tokens.map(token => token.platform);
        
        selects.forEach(select => {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add connected platforms
            connectedPlatforms.forEach(platform => {
                const option = document.createElement('option');
                option.value = platform;
                option.textContent = Utils.getPlatformDisplayName(platform);
                select.appendChild(option);
            });
            
            // Show hint if no platforms connected
            const platformHint = document.getElementById('platformHint');
            if (platformHint) {
                platformHint.textContent = connectedPlatforms.length === 0 ? 
                    'No platforms connected. Connect a platform first.' :
                    'Make sure you\'ve connected this platform first';
            }
        });
    }

    async handleSchedulePost(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const postData = {
            platform: formData.get('platform'),
            message: formData.get('message'),
            media_url: formData.get('mediaUrl'),
            schedule: new Date(formData.get('scheduleTime')).toISOString()
        };
        
        // Validate form
        if (!this.validateScheduleForm(postData)) {
            return;
        }
        
        try {
            Utils.showLoading(document.getElementById('scheduleBtn'));
            
            const result = await API.schedulePost(postData);
            
            if (result.success) {
                Utils.showNotification(result.message, 'success');
                form.reset();
                this.initializeScheduleForm();
                
                // Reload posts data
                await this.loadUserPosts();
            }
        } catch (error) {
            console.error('Failed to schedule post:', error);
            Utils.showNotification(error.message, 'error');
        } finally {
            Utils.hideLoading(document.getElementById('scheduleBtn'));
        }
    }

    validateScheduleForm(postData) {
        let isValid = true;
        
        if (!postData.platform) {
            Utils.showNotification('Please select a platform', 'error');
            isValid = false;
        }
        
        if (!postData.message || postData.message.trim().length === 0) {
            Utils.showNotification('Please enter a message', 'error');
            isValid = false;
        }
        
        if (!postData.schedule || isNaN(new Date(postData.schedule).getTime())) {
            Utils.showNotification('Please select a valid schedule time', 'error');
            isValid = false;
        }
        
        const scheduleTime = new Date(postData.schedule);
        if (scheduleTime < new Date()) {
            Utils.showNotification('Schedule time must be in the future', 'error');
            isValid = false;
        }
        
        return isValid;
    }

    async handleConnectPlatform(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const platform = formData.get('platform');
        
        // Platform-specific validation would go here
        const tokenData = {
            platform: platform,
            token: formData.get('token'),
            page_id_chat_id: formData.get('page_id_chat_id')
        };
        
        try {
            Utils.showLoading(document.getElementById('connectBtn'));
            
            const result = await API.saveToken(tokenData);
            
            if (result.success) {
                Utils.showNotification(result.message, 'success');
                form.reset();
                
                // Reload tokens and update UI
                await this.loadUserTokens();
                this.updatePlatformOptions();
            }
        } catch (error) {
            console.error('Failed to connect platform:', error);
            Utils.showNotification(error.message, 'error');
        } finally {
            Utils.hideLoading(document.getElementById('connectBtn'));
        }
    }

    handlePlatformChange(event) {
        const platform = event.target.value;
        const fieldsContainer = document.getElementById('platformFields');
        
        if (!platform) {
            fieldsContainer.innerHTML = '';
            return;
        }
        
        // Platform-specific field configuration
        const fieldConfigs = {
            telegram: [
                { name: 'token', label: 'Bot Token', type: 'text', placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11' },
                { name: 'page_id_chat_id', label: 'Chat ID', type: 'text', placeholder: '-1001234567890' }
            ],
            facebook: [
                { name: 'token', label: 'Page Access Token', type: 'text', placeholder: 'EAACEdEose0cBA...' },
                { name: 'page_id_chat_id', label: 'Page ID', type: 'text', placeholder: '123456789012345' }
            ],
            twitter: [
                { name: 'token', label: 'Bearer Token', type: 'text', placeholder: 'AAAAAAAAAAAAAAAAAAAAA...' },
                { name: 'page_id_chat_id', label: 'Account ID', type: 'text', placeholder: '123456789' }
            ]
        };
        
        const fields = fieldConfigs[platform] || [
            { name: 'token', label: 'Access Token', type: 'text', placeholder: 'Enter access token' },
            { name: 'page_id_chat_id', label: 'Account ID', type: 'text', placeholder: 'Enter account ID' }
        ];
        
        fieldsContainer.innerHTML = fields.map(field => `
            <div class="form-group">
                <label for="${field.name}" class="form-label">${field.label}</label>
                <input 
                    type="${field.type}" 
                    id="${field.name}" 
                    name="${field.name}" 
                    class="form-input" 
                    placeholder="${field.placeholder}"
                    required
                >
            </div>
        `).join('');
    }

    updatePostPreview() {
        const message = document.getElementById('message').value;
        const mediaUrl = document.getElementById('mediaUrl').value;
        const preview = document.getElementById('postPreview');
        
        if (!message.trim()) {
            preview.innerHTML = '<p class="preview-placeholder">Your post preview will appear here...</p>';
            return;
        }
        
        let previewHtml = `
            <div class="preview-content">
                <div class="preview-text">${Utils.sanitizeHtml(message)}</div>
        `;
        
        if (mediaUrl) {
            if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                previewHtml += `<div class="preview-media"><img src="${mediaUrl}" alt="Preview image" style="max-width: 100%; border-radius: 8px;"></div>`;
            } else if (mediaUrl.match(/\.(mp4|mov|avi|webm)$/i)) {
                previewHtml += `<div class="preview-media"><video src="${mediaUrl}" controls style="max-width: 100%; border-radius: 8px;"></video></div>`;
            } else {
                previewHtml += `<div class="preview-media"><a href="${mediaUrl}" target="_blank">${mediaUrl}</a></div>`;
            }
        }
        
        previewHtml += '</div>';
        preview.innerHTML = previewHtml;
    }

    updateCharCount() {
        const message = document.getElementById('message');
        const charCount = document.querySelector('.char-count');
        
        if (message && charCount) {
            const count = message.value.length;
            charCount.textContent = `${count}/4000 characters`;
            
            // Update color based on count
            if (count > 3800) {
                charCount.style.color = 'var(--error-500)';
            } else if (count > 3500) {
                charCount.style.color = 'var(--warning-500)';
            } else {
                charCount.style.color = 'var(--gray-500)';
            }
        }
    }

    updateRelativeTimes() {
        // Update all relative time elements on the page
        const timeElements = document.querySelectorAll('.activity-time, .platform-details');
        timeElements.forEach(element => {
            // This would need to store the original timestamp in a data attribute
            // and update the text content with the new relative time
        });
    }

    async reconnectPlatform(platform) {
        // Implementation for reconnecting a platform
        Utils.showNotification(`Reconnect functionality for ${platform} would be implemented here`, 'info');
    }

    async disconnectPlatform(platform) {
        if (confirm(`Are you sure you want to disconnect ${Utils.getPlatformDisplayName(platform)}?`)) {
            // Implementation for disconnecting a platform
            Utils.showNotification(`Disconnect functionality for ${platform} would be implemented here`, 'info');
        }
    }
}

// Global dashboard instance
let dashboard;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});

// Global refresh function for quick actions
async function refreshDashboard() {
    if (dashboard) {
        Utils.showNotification('Refreshing dashboard data...', 'info');
        await dashboard.loadInitialData();
        Utils.showNotification('Dashboard data updated', 'success');
    }
}
