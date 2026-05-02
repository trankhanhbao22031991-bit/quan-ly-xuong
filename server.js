const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const FILE = "tasks.json";

// LOAD SAFE
function load() {
  try {
    if (!fs.existsSync(FILE)) return [];
    const data = fs.readFileSync(FILE, "utf8");
    return JSON.parse(data || "[]");
  } catch (e) {
    return [];
  }
}

// SAVE SAFE
function save(data) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("SAVE ERROR:", e);
  }
}

let tasks = load();

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("data", tasks);

  // ADD
  socket.on("add", (task) => {
    if (!task || !task.name) return;

    tasks.push({
      name: task.name,
      note: task.note || "",
      received: task.received || "",
      delivery: task.delivery || "",

      cat: false,
      dan: false,
      son: false,
      lap: false,
      done: false,
      delivered: false
    });

    save(tasks);
    io.emit("data", tasks);
  });

  // TOGGLE
  socket.on("toggle", ({ index, field }) => {
    if (!tasks[index]) return;

    tasks[index][field] = !tasks[index][field];

    tasks[index].done =
      tasks[index].cat &&
      tasks[index].dan &&
      tasks[index].son &&
      tasks[index].lap;

    save(tasks);
    io.emit("data", tasks);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on", PORT);
});
