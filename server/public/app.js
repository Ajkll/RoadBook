// API base URL
const API_URL = 'http://localhost:4001/api';
let accessToken = localStorage.getItem('accessToken') || null;
let userRefreshToken = localStorage.getItem('refreshToken') || null;

// Update token status display
function updateTokenStatus() {
    document.getElementById('access-token-status').innerText = accessToken ? 'Present' : 'None';
    document.getElementById('refresh-token-status').innerText = userRefreshToken ? 'Present' : 'None';
    
    if (accessToken) {
        document.getElementById('access-token-status').className = 'success';
    } else {
        document.getElementById('access-token-status').className = 'error';
    }
    
    if (userRefreshToken) {
        document.getElementById('refresh-token-status').className = 'success';
    } else {
        document.getElementById('refresh-token-status').className = 'error';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateTokenStatus();
});

// Show response in the output area
function showResponse(response) {
    const output = document.getElementById('response-output');
    if (typeof response === 'object') {
        output.value = JSON.stringify(response, null, 2);
    } else {
        output.value = response;
    }
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    showResponse({
        status: 'error',
        message: error.message || 'An error occurred',
        details: error.toString()
    });
}

// Utility to show the request details for debugging
function logRequest(endpoint, method, data) {
    console.log(`API Request: ${method} ${API_URL}${endpoint}`);
    if (data) console.log('Request Data:', data);
    // Show request in the response area too for debugging
    showResponse({
        debug: true,
        endpoint: `${API_URL}${endpoint}`,
        method,
        data,
        headers: accessToken ? {'Authorization': `Bearer ${accessToken}`} : {}
    });
}

// Make API request with authentication
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        // Log the request for debugging
        logRequest(endpoint, method, data);
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        const fetchOptions = {
            method,
            headers,
            credentials: 'include'
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            fetchOptions.body = JSON.stringify(data);
        }
        
        console.log('Fetch options:', fetchOptions);
        const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
        console.log('Response status:', response.status);
        
        try {
            const responseData = await response.json();
            console.log('Response data:', responseData);
            showResponse(responseData);
            return responseData;
        } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            showResponse({
                status: 'error',
                message: 'Error parsing server response',
                httpStatus: response.status,
                text: await response.text()
            });
            throw jsonError;
        }
    } catch (error) {
        handleApiError(error);
        throw error;
    }
}

// Register a new user
async function register() {
    try {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const displayName = document.getElementById('register-display-name').value;
        const role = document.getElementById('register-role').value;
        
        const result = await apiRequest('/auth/register', 'POST', {
            email,
            password,
            displayName,
            role
        });
        
        if (result.status === 'success') {
            accessToken = result.accessToken;
            userRefreshToken = result.refreshToken;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', userRefreshToken);
            
            updateTokenStatus();
            alert('Registration successful!');
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
}

// Login
async function login() {
    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const result = await apiRequest('/auth/login', 'POST', {
            email,
            password
        });
        
        if (result.status === 'success') {
            accessToken = result.accessToken;
            userRefreshToken = result.refreshToken;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', userRefreshToken);
            
            updateTokenStatus();
            alert('Login successful!');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// Refresh token
async function refreshToken() {
    try {
        if (!userRefreshToken) {
            alert('No refresh token available');
            return;
        }
        
        const result = await apiRequest('/auth/refresh-token', 'POST', {
            refreshToken: userRefreshToken
        });
        
        if (result.status === 'success') {
            accessToken = result.accessToken;
            localStorage.setItem('accessToken', accessToken);
            updateTokenStatus();
            alert('Token refreshed successfully!');
        }
    } catch (error) {
        console.error('Token refresh error:', error);
    }
}

// Verify token
async function verifyToken() {
    try {
        if (!accessToken) {
            alert('No access token available');
            return;
        }
        
        const result = await apiRequest('/auth/verify', 'GET');
        
        if (result.status === 'success' && result.valid) {
            alert('Token is valid!');
        } else {
            alert('Token is invalid or expired!');
            // Clear invalid token
            if (!result.valid) {
                accessToken = null;
                localStorage.removeItem('accessToken');
                updateTokenStatus();
            }
        }
    } catch (error) {
        console.error('Token verification error:', error);
    }
}

// Logout
async function logout() {
    try {
        if (!userRefreshToken) {
            alert('No refresh token available');
            return;
        }
        
        const result = await apiRequest('/auth/logout', 'POST', {
            refreshToken: userRefreshToken
        });
        
        // Clear tokens regardless of result
        accessToken = null;
        userRefreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        updateTokenStatus();
        
        if (result.status === 'success') {
            alert('Logout successful!');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Get current user
async function getCurrentUser() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        await apiRequest('/users/me', 'GET');
    } catch (error) {
        console.error('Get user error:', error);
    }
}

// Update profile
async function updateProfile() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        const displayName = document.getElementById('update-display-name').value;
        const firstName = document.getElementById('update-first-name').value;
        const lastName = document.getElementById('update-last-name').value;
        
        const data = {};
        if (displayName) data.displayName = displayName;
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        
        await apiRequest('/users/me', 'PUT', data);
    } catch (error) {
        console.error('Update profile error:', error);
    }
}

// Change password
async function changePassword() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        
        if (!currentPassword || !newPassword) {
            alert('Both current and new passwords are required');
            return;
        }
        
        await apiRequest('/users/me/password', 'PUT', {
            currentPassword,
            newPassword
        });
    } catch (error) {
        console.error('Change password error:', error);
    }
}

// Get all users (admin only)
async function getAllUsers() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        await apiRequest('/users', 'GET');
    } catch (error) {
        console.error('Get all users error:', error);
    }
}

// Create roadbook
async function createRoadbook() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        const title = document.getElementById('roadbook-title').value;
        const description = document.getElementById('roadbook-description').value;
        const targetHours = document.getElementById('roadbook-target-hours').value;
        
        if (!title) {
            alert('Title is required');
            return;
        }
        
        const data = {
            title,
            description,
            targetHours: parseInt(targetHours) || 30
        };
        
        const result = await apiRequest('/roadbooks', 'POST', data);
        
        if (result.status === 'success') {
            alert('RoadBook created successfully!');
            getMyRoadbooks(); // Refresh the list
        }
    } catch (error) {
        console.error('Create roadbook error:', error);
    }
}

// Get my roadbooks
async function getMyRoadbooks() {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        const result = await apiRequest('/roadbooks', 'GET');
        
        if (result.status === 'success' && result.data) {
            renderRoadbookList(result.data);
        }
    } catch (error) {
        console.error('Get roadbooks error:', error);
    }
}

// Render roadbook list
function renderRoadbookList(roadbooks) {
    const container = document.getElementById('roadbook-list');
    container.innerHTML = '';
    
    if (!roadbooks || roadbooks.length === 0) {
        container.innerHTML = '<p>No roadbooks found</p>';
        return;
    }
    
    roadbooks.forEach(roadbook => {
        const roadbookEl = document.createElement('div');
        roadbookEl.style.border = '1px solid #ddd';
        roadbookEl.style.padding = '10px';
        roadbookEl.style.marginBottom = '10px';
        roadbookEl.style.borderRadius = '5px';
        
        roadbookEl.innerHTML = `
            <h4>${roadbook.title}</h4>
            <p>${roadbook.description || 'No description'}</p>
            <p>Status: ${roadbook.status}</p>
            <p>Target Hours: ${roadbook.targetHours}</p>
            <button onclick="viewRoadbook('${roadbook.id}')">View Details</button>
        `;
        
        container.appendChild(roadbookEl);
    });
}

// View roadbook details
async function viewRoadbook(id) {
    try {
        if (!accessToken) {
            alert('Please log in first');
            return;
        }
        
        await apiRequest(`/roadbooks/${id}`, 'GET');
    } catch (error) {
        console.error('View roadbook error:', error);
    }
}