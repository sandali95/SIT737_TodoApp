let token = localStorage.getItem('token') || '';

    // Base URLs for backend services. Adjust these URLs to match your deployment.
    const USER_SERVICE_URL = 'http://localhost:3000';
    const TODO_SERVICE_URL = 'http://localhost:3001';

    // Update UI based on token presence.
    document.addEventListener('DOMContentLoaded', () => {
      if (token) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('todo-section').classList.remove('hidden');
        fetchTodos();
      }
    });

    // Handle Signup
    async function signup() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch(`${USER_SERVICE_URL}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.status === 201) {
          // Signup succeeded; prompt user to log in.
          document.getElementById('auth-error').innerText = 'Signup successful! Please log in.';
        } else {
          document.getElementById('auth-error').innerText = data.error || 'Signup failed';
        }
      } catch (error) {
        document.getElementById('auth-error').innerText = 'Error during signup';
      }
    }

    // Handle Login
    async function login() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      try {
        const res = await fetch(`${USER_SERVICE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
          token = data.token;
          localStorage.setItem('token', token);
          document.getElementById('auth-section').classList.add('hidden');
          document.getElementById('todo-section').classList.remove('hidden');
          fetchTodos();
        } else {
          document.getElementById('auth-error').innerText = data.error || 'Login failed';
        }
      } catch (error) {
        document.getElementById('auth-error').innerText = 'Error during login';
      }
    }

    // Fetch Todos for the authenticated user
    async function fetchTodos() {
      try {
        const res = await fetch(`${TODO_SERVICE_URL}/todos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const todos = await res.json();
        displayTodos(todos);
      } catch (error) {
        console.error('Error fetching todos', error);
      }
    }

    // Display the todos on the page
    function displayTodos(todos) {
      const list = document.getElementById('todo-list');
      list.innerHTML = '';
      todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerText = todo.title + (todo.completed ? ' [Completed]' : '');
        list.appendChild(li);
      });
    }

    // Add a new todo item
    async function addTodo() {
      const title = document.getElementById('newTodo').value;
      try {
        const res = await fetch(`${TODO_SERVICE_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title })
        });
        if (res.status === 201) {
          document.getElementById('newTodo').value = '';
          fetchTodos();
        }
      } catch (error) {
        console.error('Error adding todo', error);
      }
    }

    // Logout clears the token and resets the UI
    function logout() {
      token = '';
      localStorage.removeItem('token');
      document.getElementById('auth-section').classList.remove('hidden');
      document.getElementById('todo-section').classList.add('hidden');
    }