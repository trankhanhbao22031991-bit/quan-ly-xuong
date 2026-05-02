const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

const FILE = "tasks.json";

/* LOAD DATA */
function load() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

/* SAVE DATA */
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

app.use(express.static("public"));

/* SOCKET */
io.on("connection", (socket) => {

  console.log("client connected");

  socket.emit("data", tasks);

  /* ADD */
  socket.on("add", (t) => {

    if (!t?.name) return;

    tasks.push({
      name: t.name,
      note: t.note || "",
      received: t.received || "",
      delivery: t.delivery || "",

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

  /* TOGGLE */
  socket.on("toggle", ({ index, field }) => {

    const task = tasks[index];
    if (!task) return;

    task[field] = !task[field];

    task.done =
      task.cat &&
      task.dan &&
      task.son &&
      task.lap;

    save(tasks);
    io.emit("data", tasks);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
