// EchoVault Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.API_BASE = 'http://localhost:5000/api';
    this.currentUser = null;
    this.users = [];
    this.posts = [];
    this.analytics = {};
    this.currentPage = { users: 1, posts: 1 };
    this.isLoading = { users: false, posts: false };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuthStatus();
  }

  setupEventListeners() {
    // Login form
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
      this.logout();
    });

    // Quick action buttons
    document.getElementById('createAdminBtn').addEventListener('click', () => {
      this.showCreateAdminModal();
    });

    document.getElementById('refreshDataBtn').addEventListener('click', () => {
      this.refreshAllData();
    });

    // User management
    document.getElementById('userSearch').addEventListener('input', (e) => {
      this.searchUsers(e.target.value);
    });

    document.getElementById('userStatusFilter').addEventListener('change', () => {
      this.loadUsers();
    });

    // Post management
    document.getElementById('postSearch').addEventListener('input', (e) => {
      this.searchPosts(e.target.value);
    });

    document.getElementById('postStatusFilter').addEventListener('change', () => {
      this.loadPosts();
    });

    // Modal event listeners
    this.setupModalListeners();
  }

  setupModalListeners() {
    // Create admin modal
    document.getElementById('createAdminForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createAdmin();
    });

    // User details modal
    document.getElementById('toggleUserStatusBtn').addEventListener('click', () => {
      this.toggleUserStatus();
    });

    document.getElementById('deleteUserBtn').addEventListener('click', () => {
      this.deleteUser();
    });

    // Post details modal
    document.getElementById('deletePostBtn').addEventListener('click', () => {
      this.deletePost();
    });

    document.getElementById('restorePostBtn').addEventListener('click', () => {
      this.restorePost();
    });

    // Close modals
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.closeModal(e.target.closest('.modal'));
      });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.API_BASE}/users/auth/status`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data.authenticated && data.data.role === 'admin') {
        this.currentUser = data.data.user;
        this.showDashboard();
        await this.loadDashboardData();
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
    document.getElementById('adminSection').style.display = 'none';
  }

  showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';

    // Update header with admin info
    document.getElementById('adminName').textContent = this.currentUser.name;
  }

  async login() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const loginBtn = document.getElementById('adminLoginBtn');

    if (!email || !password) {
      this.showAlert('Please fill in all fields', 'warning');
      return;
    }

    this.setButtonLoading(loginBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.currentUser = data.data.admin;
        this.showDashboard();
        await this.loadDashboardData();
        this.showAlert('Admin login successful!', 'success');
        document.getElementById('adminLoginForm').reset();
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

  async logout() {
    try {
      await fetch(`${this.API_BASE}/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      this.currentUser = null;
      this.showLoginForm();
      this.showAlert('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout failed:', error);
      this.showAlert('Error during logout', 'danger');
    }
  }

  async loadDashboardData() {
    await Promise.all([
      this.loadAnalytics(),
      this.loadUsers(),
      this.loadPosts()
    ]);
  }

  async loadAnalytics() {
    try {
      const response = await fetch(`${this.API_BASE}/admin/analytics`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.analytics = data.data;
        this.renderAnalytics();
      }
    } catch (error) {
      console.error('Load analytics failed:', error);
    }
  }

  renderAnalytics() {
    const { users, posts } = this.analytics;

    document.getElementById('totalUsers').textContent = users.total || 0;
    document.getElementById('activeToday').textContent = users.activeToday || 0;
    document.getElementById('totalPosts').textContent = posts.total || 0;
    document.getElementById('postsToday').textContent = posts.today || 0;
  }

  async loadUsers() {
    if (this.isLoading.users) return;

    this.isLoading.users = true;
    const search = document.getElementById('userSearch').value;
    const status = document.getElementById('userStatusFilter').value;

    try {
      const params = new URLSearchParams({
        page: this.currentPage.users,
        limit: 10
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await fetch(`${this.API_BASE}/admin/users?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.users = data.data;
        this.renderUsers();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Load users failed:', error);
      this.showAlert('Error loading users', 'danger');
    } finally {
      this.isLoading.users = false;
    }
  }

  renderUsers() {
    const usersTableBody = document.getElementById('usersTableBody');

    if (this.users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <p>No users found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    usersTableBody.innerHTML = this.users.map(user => this.renderUserRow(user)).join('');
  }

  renderUserRow(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const statusClass = user.isActive ? 'status-active' : 'status-inactive';
    const statusText = user.isActive ? 'Active' : 'Inactive';

    return `
      <tr>
        <td>
          <div class="user-avatar">${initials}</div>
        </td>
        <td>
          <div class="font-weight-bold">${this.escapeHtml(user.name)}</div>
          <div class="text-muted">${this.escapeHtml(user.email)}</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <div class="text-muted">${this.formatDate(user.createdAt)}</div>
          <div class="text-muted">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</div>
        </td>
        <td>
          <div class="text-muted">${user.postCount || 0} posts</div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon edit" onclick="admin.showUserDetails('${user._id}')" title="View Details">
              👁️
            </button>
            <button class="btn-icon toggle" onclick="admin.showToggleUserModal('${user._id}')" title="Toggle Status">
              🔄
            </button>
            <button class="btn-icon delete" onclick="admin.showDeleteUserModal('${user._id}')" title="Delete User">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  async loadPosts() {
    if (this.isLoading.posts) return;

    this.isLoading.posts = true;
    const search = document.getElementById('postSearch').value;
    const status = document.getElementById('postStatusFilter').value;

    try {
      const params = new URLSearchParams({
        page: this.currentPage.posts,
        limit: 10
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await fetch(`${this.API_BASE}/admin/posts?${params}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.posts = data.data;
        this.renderPosts();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Load posts failed:', error);
      this.showAlert('Error loading posts', 'danger');
    } finally {
      this.isLoading.posts = false;
    }
  }

  renderPosts() {
    const postsTableBody = document.getElementById('postsTableBody');

    if (this.posts.length === 0) {
      postsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            <div class="empty-state">
              <p>No posts found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    postsTableBody.innerHTML = this.posts.map(post => this.renderPostRow(post)).join('');
  }

  renderPostRow(post) {
    const statusClass = post.isDeleted ? 'status-deleted' : 'status-active';
    const statusText = post.isDeleted ? 'Deleted' : 'Active';
    const authorName = post.author ? post.author.name : 'Unknown';

    return `
      <tr>
        <td>
          <div class="font-weight-bold">${this.escapeHtml(post.title)}</div>
          <div class="text-muted">${this.truncateText(this.escapeHtml(post.content), 100)}</div>
        </td>
        <td>
          <div class="font-weight-bold">${this.escapeHtml(authorName)}</div>
          <div class="text-muted">${this.escapeHtml(post.author?.email || '')}</div>
        </td>
        <td>
          <div class="text-muted">${this.formatDate(post.createdAt)}</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td>
          <div class="d-flex gap-2">
            <span>❤️ ${post.likes?.length || 0}</span>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon edit" onclick="admin.showPostDetails('${post._id}')" title="View Details">
              👁️
            </button>
            ${post.isDeleted ? `
              <button class="btn-icon toggle" onclick="admin.restorePost('${post._id}')" title="Restore Post">
                ♻️
              </button>
            ` : `
              <button class="btn-icon delete" onclick="admin.deletePost('${post._id}')" title="Delete Post">
                🗑️
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }

  searchUsers(query) {
    clearTimeout(this.searchUsersTimeout);
    this.searchUsersTimeout = setTimeout(() => {
      this.currentPage.users = 1;
      this.loadUsers();
    }, 300);
  }

  searchPosts(query) {
    clearTimeout(this.searchPostsTimeout);
    this.searchPostsTimeout = setTimeout(() => {
      this.currentPage.posts = 1;
      this.loadPosts();
    }, 300);
  }

  async refreshAllData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    this.setButtonLoading(refreshBtn, true);

    try {
      await this.loadDashboardData();
      this.showAlert('Data refreshed successfully', 'success');
    } catch (error) {
      this.showAlert('Error refreshing data', 'danger');
    } finally {
      this.setButtonLoading(refreshBtn, false);
    }
  }

  showCreateAdminModal() {
    document.getElementById('createAdminModal').classList.add('show');
  }

  async createAdmin() {
    const name = document.getElementById('newAdminName').value;
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value;
    const createBtn = document.getElementById('createAdminSubmitBtn');

    if (!name || !email || !password) {
      this.showAlert('Please fill in all fields', 'warning');
      return;
    }

    if (password.length < 6) {
      this.showAlert('Password must be at least 6 characters', 'warning');
      return;
    }

    this.setButtonLoading(createBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/users/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.closeModal(document.getElementById('createAdminModal'));
        this.showAlert('Admin user created successfully', 'success');
        this.loadUsers();
        document.getElementById('createAdminForm').reset();
      } else {
        this.showAlert(data.message || data.errors?.join(', '), 'danger');
      }
    } catch (error) {
      console.error('Create admin failed:', error);
      this.showAlert('Error creating admin user', 'danger');
    } finally {
      this.setButtonLoading(createBtn, false);
    }
  }

  async showUserDetails(userId) {
    try {
      const response = await fetch(`${this.API_BASE}/admin/users/${userId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const { user, stats } = data.data;

        document.getElementById('detailUserName').textContent = user.name;
        document.getElementById('detailUserEmail').textContent = user.email;
        document.getElementById('detailUserRole').textContent = user.role;
        document.getElementById('detailUserStatus').textContent = user.isActive ? 'Active' : 'Inactive';
        document.getElementById('detailUserJoined').textContent = this.formatDate(user.createdAt);
        document.getElementById('detailUserLastLogin').textContent = user.lastLogin ? this.formatDate(user.lastLogin) : 'Never';
        document.getElementById('detailUserPosts').textContent = stats.totalPosts;
        document.getElementById('detailUserBio').textContent = user.bio || 'No bio provided';

        this.selectedUserId = userId;
        document.getElementById('userDetailsModal').classList.add('show');
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Load user details failed:', error);
      this.showAlert('Error loading user details', 'danger');
    }
  }

  showToggleUserModal(userId) {
    this.selectedUserId = userId;
    document.getElementById('toggleUserModal').classList.add('show');
  }

  async toggleUserStatus() {
    if (!this.selectedUserId) return;

    const toggleBtn = document.getElementById('confirmToggleUserBtn');
    this.setButtonLoading(toggleBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/users/${this.selectedUserId}/toggle`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.closeModal(document.getElementById('toggleUserModal'));
        this.showAlert(data.message, 'success');
        this.loadUsers();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Toggle user status failed:', error);
      this.showAlert('Error toggling user status', 'danger');
    } finally {
      this.setButtonLoading(toggleBtn, false);
    }
  }

  showDeleteUserModal(userId) {
    this.selectedUserId = userId;
    document.getElementById('deleteUserModal').classList.add('show');
  }

  async deleteUser() {
    if (!this.selectedUserId) return;

    const deleteBtn = document.getElementById('confirmDeleteUserBtn');
    this.setButtonLoading(deleteBtn, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/users/${this.selectedUserId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.closeModal(document.getElementById('deleteUserModal'));
        this.showAlert(data.message, 'success');
        this.loadUsers();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Delete user failed:', error);
      this.showAlert('Error deleting user', 'danger');
    } finally {
      this.setButtonLoading(deleteBtn, false);
    }
  }

  async deletePost(postId) {
    const deleteBtn = postId ? document.getElementById(`deletePostBtn_${postId}`) : document.getElementById('deletePostBtn');
    const btnToLoad = deleteBtn || document.getElementById('deletePostBtn');

    this.setButtonLoading(btnToLoad, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.showAlert(data.message, 'success');
        this.loadPosts();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Delete post failed:', error);
      this.showAlert('Error deleting post', 'danger');
    } finally {
      this.setButtonLoading(btnToLoad, false);
    }
  }

  async restorePost(postId) {
    const restoreBtn = postId ? document.getElementById(`restorePostBtn_${postId}`) : document.getElementById('restorePostBtn');
    const btnToLoad = restoreBtn || document.getElementById('restorePostBtn');

    this.setButtonLoading(btnToLoad, true);

    try {
      const response = await fetch(`${this.API_BASE}/admin/posts/${postId}/restore`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.showAlert(data.message, 'success');
        this.loadPosts();
      } else {
        this.showAlert(data.message, 'danger');
      }
    } catch (error) {
      console.error('Restore post failed:', error);
      this.showAlert('Error restoring post', 'danger');
    } finally {
      this.setButtonLoading(btnToLoad, false);
    }
  }

  showPostDetails(postId) {
    const post = this.posts.find(p => p._id === postId);
    if (!post) return;

    document.getElementById('detailPostTitle').textContent = post.title;
    document.getElementById('detailPostContent').textContent = post.content;
    document.getElementById('detailPostAuthor').textContent = post.author?.name || 'Unknown';
    document.getElementById('detailPostCreated').textContent = this.formatDate(post.createdAt);
    document.getElementById('detailPostLikes').textContent = post.likes?.length || 0;
    document.getElementById('detailPostStatus').textContent = post.isDeleted ? 'Deleted' : 'Active';

    this.selectedPostId = postId;
    document.getElementById('postDetailsModal').classList.add('show');
  }

  closeModal(modal) {
    modal.classList.remove('show');
    this.selectedUserId = null;
    this.selectedPostId = null;
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

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.admin = new AdminDashboard();
});