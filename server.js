const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE = "tasks.json";

/* LOAD */
function load() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

/* SAVE */
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

/* STATIC */
app.use(express.static("public"));

/* SOCKET */
io.on("connection", (socket) => {

  socket.emit("data", tasks);

  // thêm đơn
  socket.on("add", (task) => {

    if (!task.name || !task.name.trim()) return;

    const newTask = {
      name: task.name.trim(),
      received: task.received || "",
      delivery: task.delivery || "",

      cat: false,
      dan: false,
      son: false,
      lap: false,

      done: false,
      delivered: false
    };

    tasks.push(newTask);
    save(tasks);
    io.emit("data", tasks);
  });

  // toggle
  socket.on("toggle", ({ index, field }) => {

    if (!tasks[index]) return;

    tasks[index][field] = !tasks[index][field];

    const t = tasks[index];

    // auto xong
    t.done = t.cat && t.dan && t.son && t.lap;

    // nếu đã giao thì coi như xong
    if (t.delivered) t.done = true;

    save(tasks);
    io.emit("data", tasks);
  });

});

/* RUN */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server chạy:", PORT);
});
