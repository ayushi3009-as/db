async function loadUsers() {
  const res = await fetch('http://localhost:5000/api/admin/users');
  const users = await res.json();
  const list = document.getElementById('users');
  list.innerHTML = '';

  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.username} (${u.email})`;

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = async () => {
      await fetch(`http://localhost:5000/api/admin/users/${u._id}`, {
        method: 'DELETE'
      });
      loadUsers();
    };

    li.appendChild(del);
    list.appendChild(li);
  });
}
