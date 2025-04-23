// script.js

let token = localStorage.getItem('token') || '';

// Adjust these to match your services
const USER_SERVICE_URL = 'http://localhost:3000';
const TODO_SERVICE_URL = 'http://localhost:3001';

// DOM refs
const authSection  = document.getElementById('auth-section');
const todoSection  = document.getElementById('todo-section');
const authError    = document.getElementById('auth-error');
const usernameEl   = document.getElementById('username');
const passwordEl   = document.getElementById('password');
const signupBtn    = document.getElementById('signup-btn');
const loginBtn     = document.getElementById('login-btn');
const logoutBtn    = document.getElementById('logout-btn');
const newTodoEl    = document.getElementById('newTodo');
const addBtn       = document.getElementById('add-btn');
const todoListEl   = document.getElementById('todo-list');

// On load, decide which section to show
document.addEventListener('DOMContentLoaded', () => {
  if (token) {
    _showTodos();
  } else {
    _showAuth();
  }
});

// ─── Auth Handlers ─────────────────────────────────────────────────────────────

signupBtn.addEventListener('click', async () => {
  authError.textContent = '';
  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();
  if (!username || !password) {
    authError.textContent = 'Username & password required';
    return;
  }
  try {
    const res = await fetch(`${USER_SERVICE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.status === 201) {
      authError.style.color = 'green';
      authError.textContent = 'Signup successful—please log in.';
    } else {
      throw new Error(data.error || 'Signup failed');
    }
  } catch (err) {
    authError.style.color = 'var(--danger)';
    authError.textContent = err.message;
  }
});

loginBtn.addEventListener('click', async () => {
  authError.textContent = '';
  const username = usernameEl.value.trim();
  const password = passwordEl.value.trim();
  if (!username || !password) {
    authError.textContent = 'Username & password required';
    return;
  }
  try {
    const res = await fetch(`${USER_SERVICE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      _showTodos();
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (err) {
    authError.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  token = '';
  localStorage.removeItem('token');
  usernameEl.value = passwordEl.value = '';
  _showAuth();
});

// ─── Todo CRUD ────────────────────────────────────────────────────────────────

addBtn.addEventListener('click', async () => {
  const text = newTodoEl.value.trim();
  if (!text) return;
  try {
    const res = await fetch(`${TODO_SERVICE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title: text }),
    });
    if (!res.ok) throw new Error('Failed to add todo');
    newTodoEl.value = '';
    _loadTodos();
  } catch (err) {
    console.error(err);
  }
});

async function _loadTodos() {
  try {
    const res = await fetch(`${TODO_SERVICE_URL}/todos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch todos');
    const todos = await res.json();
    _renderTodos(todos);
  } catch (err) {
    console.error(err);
  }
}

function _renderTodos(todos) {
  todoListEl.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    // entry animation
    li.style.opacity = 0;
    li.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      li.style.transition = 'all 0.3s';
      li.style.opacity = 1;
      li.style.transform = '';
    });

    // checkbox
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = todo.completed;
    cb.addEventListener('change', () => _toggleTodo(todo._id));

    // text
    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = todo.title;

    // delete button
    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.textContent = 'X';
    del.addEventListener('click', () => _deleteTodo(todo._id));

    li.append(cb, span, del);
    todoListEl.append(li);
  });
}

async function _toggleTodo(id) {
  try {
    await fetch(`${TODO_SERVICE_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    _loadTodos();
  } catch (err) {
    console.error('Toggle failed', err);
  }
}

async function _deleteTodo(id) {
  try {
    await fetch(`${TODO_SERVICE_URL}/todos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    _loadTodos();
  } catch (err) {
    console.error('Delete failed', err);
  }
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function _showAuth() {
  authSection.classList.remove('hidden');
  todoSection.classList.add('hidden');
}

function _showTodos() {
  authError.textContent = '';
  authSection.classList.add('hidden');
  todoSection.classList.remove('hidden');
  _loadTodos();
}
