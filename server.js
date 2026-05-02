const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE = "tasks.json";

/* ================= LOAD / SAVE ================= */

function load() {
  if (!fs.existsSync(FILE)) return [];

  try {
    let data = JSON.parse(fs.readFileSync(FILE));

    // chuẩn hoá data cũ
    data = data.map(t => ({
      name: t.name || "",
      received: t.received || "",
      delivery: t.delivery || "",
      cat: t.cat || false,
      dan: t.dan || false,
      son: t.son || false,
      lap: t.lap || false,
      done: t.done || false
    }));

    return data;

  } catch (e) {
    console.log("Lỗi đọc file:", e);
    return [];
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

let tasks = load();

/* ================= STATIC ================= */

app.use(express.static("public"));

/* ================= SOCKET ================= */

io.on("connection", (socket) => {
  socket.emit("data", tasks);

  // ADD TASK
  socket.on("add", (task) => {

    const newTask = {
      name: task.name || "",
      received: task.received || "",
      delivery: task.delivery || "",
      cat: false,
      dan: false,
      son: false,
      lap: false,
      done: false
    };

    tasks.push(newTask);
    save(tasks);
    io.emit("data", tasks);
  });

  // TOGGLE STEP
  socket.on("toggle", ({ index, field }) => {

    if (!tasks[index]) return;

    if (tasks[index][field] === undefined) {
      tasks[index][field] = false;
    }

    tasks[index][field] = !tasks[index][field];

    // auto DONE
    const t = tasks[index];
    t.done = t.cat && t.dan && t.son && t.lap;

    save(tasks);
    io.emit("data", tasks);
  });

});

/* ================= SERVER ================= */

// Render dùng PORT env
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server chạy tại port:", PORT);
});
