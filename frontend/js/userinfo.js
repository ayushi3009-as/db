const userId = localStorage.getItem("userId");

async function loadPosts() {
  const res = await fetch("http://localhost:5000/api/posts/all");
  const data = await res.json();

  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";
  data.forEach(p => {
    postsDiv.innerHTML += `
      <div class="post">
        <h3>${p.title}</h3>
        <p>${p.content}</p>
        <small>By: ${p.userId?.name || 'Unknown'}</small>
      </div>`;
  });
}

function openProfile() {
  window.location.href = `profile.html?userId=${userId}`;
}

loadPosts();
