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

/* LOAD */
function load(){
  try{
    if(!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE,"utf-8") || "[]");
  }catch{
    return [];
  }
}

/* SAVE */
function save(data){
  fs.writeFileSync(FILE, JSON.stringify(data,null,2));
}

let tasks = load();

/* ID GENERATOR */
function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

app.use(express.static("public"));

io.on("connection",(socket)=>{

  socket.emit("data", tasks);

  /* ADD */
  socket.on("add",(t)=>{

    if(!t?.name?.trim()) return;

    tasks.push({
      id: uid(),
      name: t.name.trim(),
      note: t.note || "",
      received: t.received || "",
      delivery: t.delivery || "",

      cat:false,
      dan:false,
      son:false,
      lap:false,
      done:false,
      delivered:false
    });

    save(tasks);
    io.emit("data", tasks);
  });

  /* TOGGLE BY ID */
  socket.on("toggle",({id,field})=>{

    const task = tasks.find(x=>x.id === id);
    if(!task) return;

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

server.listen(process.env.PORT || 3000,()=>{
  console.log("ERP ID SERVER RUNNING");
});
