console.log("app.js loaded");

//Find the form and its fields in the HTML.
const taskForm = document.getElementById("task-form");
const nameInput = document.getElementById("task-name");
const taskCateg = document.getElementById("task-category");
const deadlineInput = document.getElementById("task-deadline");
const statusInput = document.getElementById("task-status");

//Finding the filters, the message, and the task list.
const categoryFilter = document.getElementById("category-filter");
const statusFilter = document.getElementById("status-filter");
const emptyMessage = document.getElementById("empty-message");
const taskList = document.getElementById("task-list");

let tasks = [];
//Adding  task when the form submitted.
function addTask(event) {
  event.preventDefault();
  console.log("Form submitted");
  //Remove extra spaces from the name.
  const taskName = nameInput.value.trim();
  if (taskName === "") {
    emptyMessage.textContent = "Please enter a task name.";
    nameInput.focus();
    return;
  }
  //Read the four fields and put their values into one object
  const newTask = {
    name: taskName,
    category: taskCateg.value,
    deadline: deadlineInput.value,
    status: statusInput.value,
  };
  //Adding the object to the array saving it  and update the list
  tasks.push(newTask);
  saveTasks();
  taskForm.reset();
  displayTasks();
}
//Show the tasks that match the filters
function displayTasks() {
  // Clear the old list before rebuilding it
  taskList.replaceChildren();
  emptyMessage.textContent = "";
  const visibleTasks = filterTasks();

  for (const task of visibleTasks) {
    const item = document.createElement("li");
    const currentStatus = getStatus(task);

    item.textContent = `${task.name} | ${task.category} | Due: ${task.deadline} | ${currentStatus} `;
    //Create a button for this task
    const button = document.createElement("button");
    button.type = "button";
    if (task.status === "Completed") {
      button.textContent = "Mark In Progress";
    } else {
      button.textContent = "Mark Completed";
    }
    // When the button is clicked, update this task
    button.addEventListener("click", function () {
      updateStatus(task);
    });
    item.appendChild(button);
    taskList.appendChild(item);
  }
  if (tasks.length === 0) {
    emptyMessage.textContent = "No tasks yet.";
  } else if (visibleTasks.length === 0) {
    emptyMessage.textContent = "No tasks match your filters.";
  }
}
// Change the status, save the change, and update the list
function updateStatus(task) {
  if (task.status === "Completed") {
    task.status = "In Progress";
  } else {
    task.status = "Completed";
  }
  saveTasks();
  displayTasks();
}
//  Check whether an unfinished task is overdue
function getStatus(task) {
  if (task.status === "Completed") {
    return "Completed";
  }
  // Compare both dates at midnight so a task due today is still on time
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(task.deadline + "T00:00:00");

  if (deadline < today) {
    return "Overdue";
  }
  return "In Progress";
}
//Find the tasks that match both dropdowns.
function filterTasks() {
  const matchingTasks = [];
  for (const task of tasks) {
    //An empty value means the user selected "All"
    const categoryMatches =
      categoryFilter.value === "" || task.category === categoryFilter.value;
    const statusMatches =
      statusFilter.value === "" || getStatus(task) === statusFilter.value;
    if (categoryMatches && statusMatches) {
      matchingTasks.push(task);
    }
  }
  return matchingTasks;
}
//Save the array as text in localStorage.
function saveTasks() {
  const tasksAsText = JSON.stringify(tasks);
  localStorage.setItem("taskManagementTasks", tasksAsText);
}
// When the page openn turn the saved text back into an array
const savedTasks = localStorage.getItem("taskManagementTasks");
if (savedTasks !== null) {
  tasks = JSON.parse(savedTasks);
}
//Connect the form and filters when the page loads.
taskForm.addEventListener("submit", addTask);
categoryFilter.addEventListener("change", displayTasks);
statusFilter.addEventListener("change", displayTasks);
//Show the task list as soon as the page opens.
displayTasks();
