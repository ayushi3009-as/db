async function loadUsers() {
  const res = await fetch("http://localhost:5000/api/admin/users");
  const data = await res.json();

  const usersDiv = document.getElementById("users");
  usersDiv.innerHTML = "<h3>All Users</h3>";
  data.forEach(u => {
    usersDiv.innerHTML += `<div class='user' onclick='loadPosts("${u._id}")'>${u.name}</div>`;
  });
}

async function loadPosts(userId) {
  const res = await fetch(`http://localhost:5000/api/posts/user/${userId}`);
  const data = await res.json();

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = `<h3>User Posts</h3>`;
  data.forEach(p => {
    postsDiv.innerHTML += `
      <div class="post">
        <h4>${p.title}</h4>
        <p>${p.content}</p>
        <button onclick='deletePost("${p._id}")'>Delete</button>
      </div>`;
  });
}

async function deletePost(postId) {
  await fetch(`http://localhost:5000/api/posts/${postId}`, { method: "DELETE" });
  alert("Post deleted!");
}

loadUsers();
