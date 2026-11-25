// ============================================================
// Task Manager
// ============================================================

const STORAGE_KEY = 'taskManagerTasks';
const STATUSES = ['In Progress', 'Completed', 'Overdue'];

// ---------- DOM elements ----------
const form = document.getElementById('task-form');
const nameInput = document.getElementById('task-name');
const categoryInput = document.getElementById('task-category');
const deadlineInput = document.getElementById('task-deadline');
const statusInput = document.getElementById('task-status');
const message = document.getElementById('message');

const filterStatus = document.getElementById('filter-status');
const filterCategory = document.getElementById('filter-category');
const clearFiltersBtn = document.getElementById('clear-filters');

const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const emptyState = document.getElementById('empty-state');

// ---------- State ----------
// Every task is an object: { id, name, category, deadline, status }
let tasks = loadTasks();

// ============================================================
// Local storage
// ============================================================

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    showMessage('Could not save your tasks in this browser.', true);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return []; // storage unavailable or data was corrupted
  }
}

// ============================================================
// Dates and overdue check
// ============================================================

// Returns today's date as "YYYY-MM-DD" in the user's local time.
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// "2026-11-30" -> "Nov 30, 2026"
function formatDate(dateString) {
  const parts = dateString.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Marks every unfinished task whose deadline has passed as "Overdue".
// Returns true if at least one task changed.
function checkOverdue() {
  const today = getToday();
  let changed = false;

  tasks.forEach(function (task) {
    const pastDeadline = task.deadline < today;
    if (pastDeadline && task.status !== 'Completed' && task.status !== 'Overdue') {
      task.status = 'Overdue';
      changed = true;
    }
  });

  if (changed) saveTasks();
  return changed;
}

// ============================================================
// Add, update, delete
// ============================================================

function addTask(name, category, deadline, status) {
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name,
    category: category,
    deadline: deadline,
    status: status
  };

  tasks.push(task);
  checkOverdue(); // a task added with a past deadline becomes Overdue
  saveTasks();
  renderTasks();
}

function updateStatus(id, newStatus) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;

  task.status = newStatus;
  checkOverdue();
  saveTasks();
  renderTasks();

  // The deadline rule can override the user's choice.
  if (task.status !== newStatus) {
    showMessage('"' + task.name + '" is past its deadline, so it stays Overdue until it is Completed.', true);
  } else {
    showMessage('Status updated to ' + newStatus + '.');
  }
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  renderTasks();
  showMessage('Task deleted.');
}

// ============================================================
// Filtering
// ============================================================

function getVisibleTasks() {
  const statusValue = filterStatus.value;
  const categoryValue = filterCategory.value;

  return tasks
    .filter(function (task) {
      const statusMatch = statusValue === 'All' || task.status === statusValue;
      const categoryMatch = categoryValue === 'All' || task.category === categoryValue;
      return statusMatch && categoryMatch;
    })
    .sort(function (a, b) {
      return a.deadline.localeCompare(b.deadline); // earliest deadline first
    });
}

// ============================================================
// Rendering
// ============================================================

function statusClass(status) {
  return 'status-' + status.toLowerCase().replace(' ', '-');
}

function createTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task' + (task.status === 'Completed' ? ' is-completed' : '');
  li.dataset.id = task.id;

  // Left side: name and details
  const info = document.createElement('div');
  info.className = 'task-info';

  const title = document.createElement('p');
  title.className = 'task-name';
  title.textContent = task.name;

  const details = document.createElement('p');
  details.className = 'task-meta';
  details.textContent = task.category + '  |  Due ' + formatDate(task.deadline);

  info.append(title, details);

  // Right side: status dropdown and delete button
  const controls = document.createElement('div');
  controls.className = 'task-controls';

  const select = document.createElement('select');
  select.className = 'status-select ' + statusClass(task.status);
  select.setAttribute('aria-label', 'Status for ' + task.name);

  STATUSES.forEach(function (status) {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    option.selected = status === task.status;
    select.appendChild(option);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete ' + task.name);

  controls.append(select, deleteBtn);
  li.append(info, controls);
  return li;
}

function renderTasks() {
  const visible = getVisibleTasks();

  // Build everything in a DocumentFragment, then add it to the page once.
  const fragment = document.createDocumentFragment();
  visible.forEach(function (task) {
    fragment.appendChild(createTaskItem(task));
  });

  taskList.replaceChildren(fragment);

  // Count and empty state
  taskCount.textContent = visible.length + ' of ' + tasks.length + ' shown';

  if (tasks.length === 0) {
    emptyState.textContent = 'No tasks yet. Add your first task above.';
    emptyState.hidden = false;
  } else if (visible.length === 0) {
    emptyState.textContent = 'No tasks match these filters.';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

function showMessage(text, isWarning) {
  message.textContent = text;
  message.classList.toggle('is-warning', Boolean(isWarning));
}

// ============================================================
// Event listeners
// ============================================================

// Add a task
form.addEventListener('submit', function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const deadline = deadlineInput.value;

  if (name === '') {
    showMessage('Enter a task name.', true);
    nameInput.focus();
    return;
  }
  if (deadline === '') {
    showMessage('Choose a deadline.', true);
    deadlineInput.focus();
    return;
  }

  addTask(name, categoryInput.value, deadline, statusInput.value);

  form.reset();
  nameInput.focus();
  showMessage('Task added.');
});

// Event delegation: one listener on the list handles every task.
taskList.addEventListener('change', function (event) {
  const select = event.target.closest('.status-select');
  if (!select) return;

  const id = select.closest('li').dataset.id;
  updateStatus(id, select.value);
});

taskList.addEventListener('click', function (event) {
  const button = event.target.closest('.delete-btn');
  if (!button) return;

  const id = button.closest('li').dataset.id;
  deleteTask(id);
});

// Filters
filterStatus.addEventListener('change', renderTasks);
filterCategory.addEventListener('change', renderTasks);

clearFiltersBtn.addEventListener('click', function () {
  filterStatus.value = 'All';
  filterCategory.value = 'All';
  renderTasks();
});

// ============================================================
// Start the app
// ============================================================

checkOverdue();
renderTasks();

// Re-check once a minute so tasks turn Overdue while the page stays open.
setInterval(function () {
  if (checkOverdue()) renderTasks();
}, 60000);
