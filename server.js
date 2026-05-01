const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE = "tasks.json";

// load dữ liệu
function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

// lưu dữ liệu
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

// serve giao diện
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.emit("data", tasks);

  // thêm task
  socket.on("add", (task) => {
    tasks.push({
      name: task.name,
      worker: task.worker,
      cat: false,
      dan: false,
      son: false,
      lap: false,
      done: false
    });

    save(tasks);
    io.emit("data", tasks);
  });

  // toggle công đoạn
  socket.on("toggle", ({ index, field }) => {
    if (!tasks[index]) return;

    tasks[index][field] = !tasks[index][field];

    // auto hoàn thành
    if (
      tasks[index].cat &&
      tasks[index].dan &&
      tasks[index].son &&
      tasks[index].lap
    ) {
      tasks[index].done = true;
    } else {
      tasks[index].done = false;
    }

    save(tasks);
    io.emit("data", tasks);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// 🔥 QUAN TRỌNG CHO RENDER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
