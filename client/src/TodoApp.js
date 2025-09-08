import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./TodoApp.css";
import notificationSound from "./alert.mp3";

const API_URL = "https://ambitask.onrender.com";

function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [taskDateTime, setTaskDateTime] = useState("");
  const [currentFilter, setCurrentFilter] = useState("all");

  const [editingTask, setEditingTask] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [textNotifications, setTextNotifications] = useState([]);

  // ---------------------------
  // Functions defined first
  // ---------------------------

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, updates);
      setTasks((prev) => prev.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    const newTask = {
      title: taskInput.trim(),
      completed: false,
      important: false,
      dueDateTime: taskDateTime ? new Date(taskDateTime).toISOString() : "",
      notified: false,
    };

    try {
      const res = await axios.post(API_URL, newTask);
      setTasks([res.data, ...tasks]);
      setTaskInput("");
      setTaskDateTime("");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompletion = (task) => updateTask(task._id, { completed: !task.completed });
  const toggleImportant = (task) => updateTask(task._id, { important: !task.important });

  const handleEdit = (task) => {
    setEditingTask(task);
    setEditInput(task.title);
    setEditDateTime(task.dueDateTime ? new Date(task.dueDateTime).toISOString().slice(0, 16) : "");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editInput.trim()) return;

    try {
      const res = await axios.put(`${API_URL}/${editingTask._id}`, {
        title: editInput.trim(),
        dueDateTime: editDateTime ? new Date(editDateTime).toISOString() : "",
      });
      setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data : t)));
      setEditingTask(null);
      setEditInput("");
      setEditDateTime("");
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------
  // Effects
  // ---------------------------

  // Load tasks
  useEffect(() => {
    fetchTasks();
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [fetchTasks]);

  // Check for due tasks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((task) => {
        if (
          task.dueDateTime &&
          !task.notified &&
          new Date(task.dueDateTime) <= now &&
          !task.completed
        ) {
          // Play sound
          new Audio(notificationSound).play();

          // Browser notification
          if (Notification.permission === "granted") {
            new Notification("Task Due!", { body: task.title });
          }

          // Inline text notification
          setTextNotifications((prev) => [
            ...prev,
            { id: task._id, message: `Task "${task.title}" is due!` },
          ]);
          setTimeout(() => {
            setTextNotifications((prev) => prev.filter((n) => n.id !== task._id));
          }, 5000);

          updateTask(task._id, { notified: true });
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, updateTask]);

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    if (currentFilter === "important") return task.important;
    return true;
  });

  // ---------------------------
  // Render
  // ---------------------------

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Filters</h2>
        <ul>
          {["all", "active", "completed", "important"].map((filter) => (
            <li
              key={filter}
              className={currentFilter === filter ? "active" : ""}
              onClick={() => setCurrentFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </li>
          ))}
        </ul>
      </aside>

      <div className="todo-box">
        <h1 className="app-title">My Tasks</h1>

        {/* Inline Text Notifications */}
        <div className="text-notifications">
          {textNotifications.map((note) => (
            <div key={note.id} className="text-notification">
              {note.message}
            </div>
          ))}
        </div>

        <form className="add-task-form" onSubmit={addTask}>
          <input
            type="text"
            className="task-input"
            placeholder="Add a new task..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            required
          />
          <input
            type="datetime-local"
            className="task-datetime"
            value={taskDateTime}
            onChange={(e) => setTaskDateTime(e.target.value)}
          />
          <button type="submit" className="add-btn">Add</button>
        </form>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">You're all caught up!</div>
        ) : (
          <ul className="task-list">
            {filteredTasks.map((task) => (
              <li key={task._id} className={`task-item ${task.completed ? "completed" : ""}`}>
                {editingTask && editingTask._id === task._id ? (
                  <form onSubmit={saveEdit} className="edit-form">
                    <input
                      type="text"
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="edit-input"
                    />
                    <input
                      type="datetime-local"
                      value={editDateTime}
                      onChange={(e) => setEditDateTime(e.target.value)}
                      className="edit-datetime"
                    />
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" onClick={() => setEditingTask(null)} className="cancel-btn">Cancel</button>
                  </form>
                ) : (
                  <>
                    <input type="checkbox" checked={task.completed} onChange={() => toggleCompletion(task)} />
                    <span className="task-text">{task.title}</span>
                    {task.dueDateTime && <span className="task-due">{new Date(task.dueDateTime).toLocaleString()}</span>}
                    <div className="task-actions">
                      <button onClick={() => toggleImportant(task)}>★</button>
                      <button onClick={() => handleEdit(task)}>✏️</button>
                      <button onClick={() => deleteTask(task._id)}>🗑</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TodoApp;
