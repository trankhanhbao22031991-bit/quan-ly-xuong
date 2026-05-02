const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE = "tasks.json";

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.emit("data", tasks);

  socket.on("add", (task) => {
    tasks.push({
      name: task.name || "",
      received: task.received || "",
      delivery: task.delivery || "",
      cat: false,
      dan: false,
      son: false,
      lap: false,
      done: false,
      delivered: false   // 👈 mới
    });

    save(tasks);
    io.emit("data", tasks);
  });

  socket.on("toggle", ({ index, field }) => {

    if (!tasks[index]) return;

    tasks[index][field] = !tasks[index][field];

    const t = tasks[index];

    // auto hoàn thành
    t.done = t.cat && t.dan && t.son && t.lap;

    // nếu tick "đã giao"
    if (field === "delivered" && t.delivered) {
      t.done = true;
    }

    save(tasks);
    io.emit("data", tasks);
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server chạy:", PORT));
