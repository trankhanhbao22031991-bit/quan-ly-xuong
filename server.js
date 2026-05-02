const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const FILE = "tasks.json";

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) { return []; }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.emit("data", tasks);

  socket.on("add", (task) => {
    if (!task.name) return;

    const newTask = {
      id: Date.now().toString(), // Tạo ID duy nhất
      name: task.name,
      note: task.note || "",
      received: task.received || "",
      delivery: task.delivery || "",
      cat: false, dan: false, son: false, lap: false,
      done: false, delivered: false
    };

    tasks.push(newTask);
    save(tasks);
    io.emit("data", tasks);
  });

  socket.on("toggle", ({ id, field }) => {
    const t = tasks.find(item => item.id === id);
    if (!t) return;

    t[field] = !t[field];
    
    // Tự động cập nhật trạng thái "Xong"
    t.done = t.cat && t.dan && t.son && t.lap;

    save(tasks);
    io.emit("data", tasks);
  });
});

server.listen(3000, () => console.log("Server đang chạy tại port 3000"));
