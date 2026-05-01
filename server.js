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

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.emit("data", tasks);

  socket.on("add", (task) => {
    tasks.push(task);
    save(tasks);
    io.emit("data", tasks);
  });

  socket.on("toggle", ({ index, field }) => {
    // đảm bảo field tồn tại
    if (tasks[index][field] === undefined) {
      tasks[index][field] = false;
    }

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
});

server.listen(3000, () => {
  const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
