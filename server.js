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

/* LOAD / SAVE */
function load() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

app.use(express.static("public"));

io.on("connection", (socket) => {

  // gửi data khi vào
  socket.emit("data", tasks);

  // thêm đơn
  socket.on("add", (task) => {
    if (!task?.name) return;

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

  // tick công đoạn + đã giao
  socket.on("toggle", ({ index, field }) => {

    const t = tasks[index];
    if (!t) return;

    t[field] = !t[field];

    // tự check done
    t.done =
      t.cat &&
      t.dan &&
      t.son &&
      t.lap;

    save(tasks);
    io.emit("data", tasks);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
