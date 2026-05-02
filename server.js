const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const FILE = "tasks.json";

/* ================= AUTO CONVERT ================= */

function convertData(oldData) {
  return oldData.map(t => {

    return {
      // giữ name cũ hoặc fallback
      name: t.name || t.product || "Không tên",

      // chuyển worker → bỏ luôn
      received: t.received || "",
      delivery: t.delivery || "",

      // giữ các bước
      cat: !!t.cat,
      dan: !!t.dan,
      son: !!t.son,
      lap: !!t.lap,

      // auto tính done lại
      done: (t.cat && t.dan && t.son && t.lap) || false,

      // thêm field mới
      delivered: !!t.delivered
    };
  });
}

/* ================= LOAD / SAVE ================= */

function load() {
  if (!fs.existsSync(FILE)) return [];

  try {
    const raw = JSON.parse(fs.readFileSync(FILE));

    const converted = convertData(raw);

    // 🔥 ghi lại file sau khi convert
    fs.writeFileSync(FILE, JSON.stringify(converted, null, 2));

    return converted;

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

  // THÊM
  socket.on("add", (task) => {

    const newTask = {
      name: task.name || "Không tên",
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

  // TOGGLE
  socket.on("toggle", ({ index, field }) => {

    if (!tasks[index]) return;

    if (tasks[index][field] === undefined) {
      tasks[index][field] = false;
    }

    tasks[index][field] = !tasks[index][field];

    const t = tasks[index];

    // auto hoàn thành
    t.done = t.cat && t.dan && t.son && t.lap;

    // nếu đã giao thì auto done
    if (t.delivered) {
      t.done = true;
    }

    save(tasks);
    io.emit("data", tasks);
  });

});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server chạy tại port:", PORT);
});
