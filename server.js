const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

const FILE = "tasks.json";

/* LOAD */
function load() {
  try {
    if (!fs.existsSync(FILE)) return [];
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

app.use(express.static("public"));

io.on("connection", (socket) => {

  console.log("CLIENT CONNECTED");

  socket.emit("data", tasks);

  /* ================= ADD FIX ================= */
  socket.on("add", (task) => {

    console.log("ADD EVENT RECEIVED:", task);

    if (!task || !task.name) {
      console.log("INVALID TASK");
      return;
    }

    const newTask = {
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
    };

    tasks.push(newTask);

    save(tasks);

    io.emit("data", tasks);

    console.log("TASK ADDED SUCCESS");
  });

  /* TOGGLE */
  socket.on("toggle", ({ index, field }) => {

    const t = tasks[index];
    if (!t) return;

    t[field] = !t[field];

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
  console.log("SERVER RUNNING");
});
