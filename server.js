const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const FILE = "tasks.json";

/* ================= USERS ================= */
const users = [
  { username: "admin", password: "123456", role: "admin" },
  { username: "tho1", password: "123456", role: "worker" },
  { username: "tho2", password: "123456", role: "worker" }
];

/* ================= LOAD / SAVE ================= */
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

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  socket.user = null;
  socket.role = null;

  console.log("USER CONNECTED");

  /* ================= LOGIN ================= */
  socket.on("login", ({ username, password }) => {

    const user = users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      socket.emit("login_fail");
      return;
    }

    socket.user = user.username;
    socket.role = user.role;

    socket.emit("login_success", {
      username: user.username,
      role: user.role
    });

    // gửi data ngay khi login
    socket.emit("data", tasks);
  });

  /* ================= REQUEST DATA (FIX CHẬM) ================= */
  socket.on("request_data", () => {
    socket.emit("data", tasks);
  });

  /* ================= ADD ================= */
  socket.on("add", (task) => {
    if (socket.role !== "admin") return;

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
      delivered: false,

      createdBy: socket.user
    });

    save(tasks);
    io.emit("data", tasks);
  });

  /* ================= TOGGLE ================= */
  socket.on("toggle", ({ index, field }) => {

    const t = tasks[index];
    if (!t) return;

    // worker không được tick delivered
    if (field === "delivered" && socket.role !== "admin") return;

    t[field] = !t[field];

    // auto done
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
