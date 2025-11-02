// EchoVault User Dashboard JavaScript
class EchoVaultDashboard {
  constructor() {
    this.API_BASE = 'http://localhost:5000/api';
    this.currentUser = null;
    this.posts = [];
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMorePosts = true;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuthStatus();
  }

  setupEventListeners() {
    // Profile dropdown
    document.getElementById('profileIcon').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleProfileDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeProfileDropdown();
    });

    // Create post form
    document.getElementById('createPostForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createPost();
    });

    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (this.shouldLoadMorePosts()) {
        this.loadMorePosts();
      }
    });

    // Profile modal buttons
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateProfile();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.logout();
    });

    document.getElementById('closeProfileModal').addEventListener('click', () => {
      this.closeProfileModal();
    });

    // Modal close on outside click
    document.getElementById('profileModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeProfileModal();
      }
    });
  }

  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.API_BASE}/users/auth/status`);
      const data = await response.json();

      if (data.success && data.data.authenticated) {
        this.currentUser = data.data.user;
        this.showDashboard();
        await this.loadPosts();
      } else {
        this.showLoginForm();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showLoginForm();
    }
  }

  showLoginForm() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';

    // Update profile icon
    this.updateProfileIcon();

    // Update profile modal with current user data
    this.populateProfileModal();
  }

  updateProfileIcon() {
    if (!this.currentUser) return;

    const profileIcon = document.getElementById('profileIcon');
    const initials = this.getInitials(this.currentUser.name);

    profileIcon.textContent = initials;
    profileIcon.title = this.currentUser.name;
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  populateProfileModal() {
    if (!this.currentUser) return;

    document.getElementById('profileName').value = this.currentUser.name;
    document.getElementById('profileEmail').value = this.currentUser.email;
    document.getElementById('profileBio').value = this.currentUser.bio || '';
    document.getElementById('profileDisplayName').textContent = this.currentUser.name;
    document.getElementById('profileDisplayEmail').textContent = this.currentUser.email;
  }

  toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
  }

  closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.remove('show');
  }

  openProfileModal() {
    this.closeProfileDropdown();
    document.getElementById('profileModal').classList.add('show');
  }

  closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
  }

  // Login functionality
  async login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) {
      this.showAlert('Please fill in all fields', 'warning');
      return;
    }

    this.setButtonLoading(loginBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.data.user;
        this.showDashboard();
        await this.loadPosts();
        this.showAlert('Login successful!', 'success');
        document.getElementById('loginForm').reset();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.showAlert('Error connecting to server', 'danger');
    } finally {
      this.setButtonLoading(loginBtn, false);
    }
  }

  async register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const registerBtn = document.getElementById('registerBtn');

    if (!name || !email || !password) {
      this.showAlert('Please fill in all fields', 'warning');
      return;
    }

    if (password.length < 6) {
      this.showAlert('Password must be at least 6 characters', 'warning');
      return;
    }

    this.setButtonLoading(registerBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.showAlert('Registration successful! Please login.', 'success');
        document.getElementById('registerForm').reset();
        this.switchToLogin();
      } else {
        this.showAlert(data.message || data.errors?.join(', '), 'danger');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      this.showAlert('Error connecting to server', 'danger');
    } finally {
      this.setButtonLoading(registerBtn, false);
    }
  }

  switchToLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('switchToRegister').style.display = 'block';
    document.getElementById('switchToLogin').style.display = 'none';
  }

  switchToRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('switchToRegister').style.display = 'none';
    document.getElementById('switchToLogin').style.display = 'block';
  }

  // Post functionality
  async createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const createBtn = document.getElementById('createPostBtn');

    if (!title || !content) {
      this.showAlert('Please fill in both title and content', 'warning');
      return;
    }

    if (title.length < 3) {
      this.showAlert('Title must be at least 3 characters', 'warning');
      return;
    }

    if (content.length < 10) {
      this.showAlert('Content must be at least 10 characters', 'warning');
      return;
    }

    this.setButtonLoading(createBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ title, content })
      });

      const data = await response.json();

      if (data.success) {
        // Add new post to the top of the feed
        this.posts.unshift(data.data);
        this.renderPosts();

        // Clear form
        document.getElementById('createPostForm').reset();
        this.showAlert('Post created successfully!', 'success');
      } else {
        this.showAlert(data.message || data.errors?.join(', '), 'danger');
      }
    } catch (error) {
      console.error('Create post failed:', error);
      this.showAlert('Error creating post', 'danger');
    } finally {
      this.setButtonLoading(createBtn, false);
    }
  }

  async loadPosts(reset = true) {
    if (this.isLoading || !this.hasMorePosts) return;

    this.isLoading = true;

    if (reset) {
      this.currentPage = 1;
      this.posts = [];
      this.hasMorePosts = true;
    }

    try {
      const response = await fetch(`${this.API_BASE}/posts?page=${this.currentPage}&limit=10`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const newPosts = data.data;

        if (reset) {
          this.posts = newPosts;
        } else {
          this.posts.push(...newPosts);
        }

        this.hasMorePosts = data.pagination.hasNext;
        this.currentPage++;

        this.renderPosts();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Load posts failed:', error);
      this.showAlert('Error loading posts', 'danger');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  loadMorePosts() {
    this.loadPosts(false);
  }

  shouldLoadMorePosts() {
    if (this.isLoading || !this.hasMorePosts) return false;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    return scrollTop + windowHeight >= documentHeight - 1000;
  }

  renderPosts() {
    const postsContainer = document.getElementById('postsContainer');

    if (this.posts.length === 0) {
      postsContainer.innerHTML = `
        <div class="empty-state">
          <h3>No posts yet</h3>
          <p>Be the first to share something with the community!</p>
        </div>
      `;
      return;
    }

    postsContainer.innerHTML = this.posts.map(post => this.renderPost(post)).join('');
  }

  renderPost(post) {
    const authorInitials = this.getInitials(post.author.name);
    const isLiked = post.isLikedBy?.(this.currentUser?._id) || false;
    const timeAgo = this.getTimeAgo(post.createdAt);

    return `
      <div class="post-card">
        <div class="post-header">
          <div class="post-avatar">
            ${post.author.profilePicture
              ? `<img src="${post.author.profilePicture}" alt="${post.author.name}">`
              : authorInitials
            }
          </div>
          <div class="post-meta">
            <div class="post-author">${this.escapeHtml(post.author.name)}</div>
            <div class="post-time">${timeAgo}</div>
          </div>
        </div>
        <div class="post-content">
          <h4>${this.escapeHtml(post.title)}</h4>
          <p>${this.truncateText(this.escapeHtml(post.content), 300)}</p>
          ${post.content.length > 300
            ? `<a href="#" class="read-more" onclick="dashboard.showFullPost('${post._id}'); return false;">Read more</a>`
            : ''
          }
        </div>
        <div class="post-actions">
          <button class="post-action ${isLiked ? 'liked' : ''}" onclick="dashboard.toggleLike('${post._id}')">
            <span>${isLiked ? '❤️' : '🤍'}</span>
            <span>${post.likeCount || 0}</span>
          </button>
          <button class="post-action" onclick="dashboard.viewPost('${post._id}')">
            <span>💬</span>
            <span>Comments</span>
          </button>
          <button class="post-action" onclick="dashboard.sharePost('${post._id}')">
            <span>📤</span>
            <span>Share</span>
          </button>
        </div>
      </div>
    `;
  }

  async toggleLike(postId) {
    try {
      const response = await fetch(`${this.API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Update post in local array
        const postIndex = this.posts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
          this.posts[postIndex].likes = data.data.liked
            ? [...(this.posts[postIndex].likes || []), this.currentUser._id]
            : (this.posts[postIndex].likes || []).filter(id => id !== this.currentUser._id);

          // Re-render posts
          this.renderPosts();
        }
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Toggle like failed:', error);
      this.showAlert('Error toggling like', 'danger');
    }
  }

  viewPost(postId) {
    // Implement post view modal
    this.showAlert('Post view coming soon!', 'info');
  }

  sharePost(postId) {
    const postUrl = `${window.location.origin}/posts/${postId}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl).then(() => {
        this.showAlert('Post link copied to clipboard!', 'success');
      }).catch(() => {
        this.showAlert('Error copying link', 'danger');
      });
    } else {
      this.showAlert('Post link: ' + postUrl, 'info');
    }
  }

  showFullPost(postId) {
    // Implement full post view
    this.showAlert('Full post view coming soon!', 'info');
  }

  // Profile functionality
  async updateProfile() {
    const name = document.getElementById('profileName').value;
    const bio = document.getElementById('profileBio').value;
    const saveBtn = document.getElementById('saveProfileBtn');

    if (!name) {
      this.showAlert('Name is required', 'warning');
      return;
    }

    this.setButtonLoading(saveBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, bio })
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.data.user;
        this.updateProfileIcon();
        this.populateProfileModal();
        this.closeProfileModal();
        this.showAlert('Profile updated successfully!', 'success');
      } else {
        this.showAlert(data.message || data.errors?.join(', '), 'danger');
      }
    } catch (error) {
      console.error('Update profile failed:', error);
      this.showAlert('Error updating profile', 'danger');
    } finally {
      this.setButtonLoading(saveBtn, false);
    }
  }

  async logout() {
    try {
      await fetch(`${this.API_BASE}/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      this.currentUser = null;
      this.posts = [];
      this.showLoginForm();
      this.showAlert('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      this.showAlert('Error during logout', 'danger');
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  }

  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.innerHTML = '<span class="loading-spinner"></span> Loading...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  updateLoadingState() {
    const loadingIndicator = document.getElementById('postsLoading');
    if (this.isLoading) {
      loadingIndicator.style.display = 'block';
    } else {
      loadingIndicator.style.display = 'none';
    }
  }

  showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alertsContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    alertsContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 5000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new EchoVaultDashboard();

  // Add global functions for onclick handlers
  window.switchToRegister = () => dashboard.switchToRegister();
  window.switchToLogin = () => dashboard.switchToLogin();
});