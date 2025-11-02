// Register new user
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const user = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  await fetch('http://localhost:5000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  alert('User registered successfully!');
});

// Fetch all users
async function getUsers() {
  const res = await fetch('http://localhost:5000/api/users');
  const data = await res.json();
  const list = document.getElementById('userList');
  list.innerHTML = '';
  data.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.username} (${u.email})`;
    list.appendChild(li);
  });
}
