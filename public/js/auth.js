// Auth module
const Auth = {
    // Decode a JWT payload without a library (base64url → JSON)
    _decodeTokenPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    },

    // Check if the stored token is expired
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;
        const payload = this._decodeTokenPayload(token);
        if (!payload || !payload.exp) return true;
        // exp is in seconds, Date.now() is in milliseconds
        // Add a 30-second buffer so we don't send a request that will fail
        return (payload.exp * 1000) < (Date.now() + 30000);
    },

    // Check if user is logged in AND token is still valid
    isAuthenticated() {
        if (!localStorage.getItem('user') || !this.getToken()) return false;
        if (this.isTokenExpired()) {
            console.warn('Session expired — auto logging out.');
            this.clearAuth();
            return false;
        }
        return true;
    },

    // Get current user from storage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Get access token
    getToken() {
        return localStorage.getItem('accessToken');
    },

    // Set auth data
    setAuth(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        if (token) {
            localStorage.setItem('accessToken', token);
        }
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
    },

    // Handle expired/invalid session — clear & redirect
    _handleSessionExpired() {
        this.clearAuth();
        // Avoid redirect loops on login/register pages
        const path = window.location.pathname;
        if (path.includes('login') || path.includes('register') || path === '/' || path === '/index.html') return;
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login.html';
    },

    // Fetch wrapper to automatically include auth header
    async fetchWithAuth(url, options = {}) {
        // Pre-flight: check token expiry before even making the request
        if (this.isTokenExpired()) {
            this._handleSessionExpired();
            throw new Error('Session expired');
        }

        const token = this.getToken();
        
        // Merge headers
        const headers = new Headers(options.headers || {});
        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }
        
        // Ensure content type is JSON for POST/PUT if body is an object
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            options.body = JSON.stringify(options.body);
            if (!headers.has('Content-Type')) {
                headers.append('Content-Type', 'application/json');
            }
        }
        
        const fetchOptions = {
            ...options,
            headers,
            credentials: 'omit'
        };

        const response = await fetch(url, fetchOptions);

        // If server says token is bad/expired, auto-logout
        if (response.status === 401 || response.status === 403) {
            this._handleSessionExpired();
            throw new Error('Session expired');
        }
        // Also catch the 400 "Please enter token!" / "Invalid access token" from your middleware
        if (response.status === 400) {
            const cloned = response.clone();
            try {
                const text = await cloned.text();
                if (text.includes('token') || text.includes('access token')) {
                    this._handleSessionExpired();
                    throw new Error('Session expired');
                }
            } catch (e) {
                // If clone/text fails, just return the original response
            }
        }

        return response;
    },

    // Login function
    async login(email, password) {
        try {
            const response = await fetch('/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Login failed');
            }
            
            const data = await response.json();
            this.setAuth(data.user, data.AccesssToken);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Register function
    async register(username, email, password, role = 'user') {
        try {
            const response = await fetch('/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Registration failed');
            }
            
            const text = await response.text();
            let data;
            try { data = JSON.parse(text); } catch(e) { data = { message: text }; }
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    // Logout function
    async logout() {
        try {
            await fetch('/user/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` }
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            this.clearAuth();
            window.location.href = '/index.html';
        }
    },

    // Forgot Password
    async forgotPassword(email) {
        try {
            const response = await fetch('/user/forgotpassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to send reset email');
            return await response.text();
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    // Reset Password
    async resetPassword(token, password) {
        try {
            const response = await fetch(`/user/resetpassword/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!response.ok) {
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.Error || text);
                } catch(e) {
                    throw new Error(text || 'Failed to reset password');
                }
            }
            return await response.text();
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },
    
    // UI Helpers
    updateNavbar() {
        const authContainer = document.querySelector('.nav-auth');
        if (!authContainer) return;
        
        if (this.isAuthenticated()) {
            const user = this.getUser();
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <a href="/profile.html" style="color: var(--text-main); text-decoration: none;">
                        <i class="fa-solid fa-user-circle"></i> ${user.username}
                    </a>
                    <button class="btn-login" onclick="Auth.logout()">Logout</button>
                    ${user.role === 'admin' ? '<a href="/admin.html" class="btn-signup" style="text-decoration:none">Admin</a>' : ''}
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <a href="/login.html" class="btn-login" style="text-decoration:none; padding: 0.6rem 1rem;">Login</a>
                <a href="/register.html" class="btn-signup" style="text-decoration:none;">Sign Up</a>
            `;
        }
    }
};

// Auto-check session validity on every page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateNavbar();
});
