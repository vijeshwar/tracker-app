import express from "express";
import mysql from "mysql2/promise";
import moment from "moment";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

console.log({
  HOST: process.env.DB_HOST,
  PORT: process.env.DB_PORT,
  DB: process.env.DB_NAME
});

import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  // 🔥 IMPORTANT for Railway
  ssl: {
    rejectUnauthorized: false
  },

  connectTimeout: 20000
});

console.log("✅ Connected to Railway DB");


// ---- 24H CHECK ----
async function allow(user, table){
 const today = moment().format("YYYY-MM-DD");

 const [r] = await db.execute(
  `SELECT * FROM ${table}
   WHERE username=? AND date=?`,
  [user,today]
 );

 return r.length===0;
}

// ---- AUTH ----
app.post("/tracker/login", async (req,res)=>{

 const [rows] = await db.execute(
  "SELECT * FROM users WHERE LOWER(username)=?",
  [req.body.email.toLowerCase()]
 );

 if(!rows[0]) return res.status(400).json({});

 const ok = await bcrypt.compare(
  req.body.password,
  rows[0].password
 );

 if(!ok) return res.status(400).json({});

 res.json({email:rows[0].username, role:rows[0].role});
});

app.post("/tracker/register", async (req,res)=>{

 const hash = await bcrypt.hash(req.body.password,10);

 await db.execute(
  "INSERT INTO users(username,password,role) VALUES(?,?,?)",
  [req.body.email,hash,"user"]
 );

 res.json({});
});

// ---- MODULES ----
app.post("/tracker/add/dsa", async (req,res)=>{
 if(!await allow(req.body.user,"logs"))
  return res.status(400).json({});

 await db.execute(
  "INSERT INTO logs(username,date,topic,count,leetcode) VALUES(?,?,?,?,?)",
  [req.body.user,moment().format("YYYY-MM-DD"),
   req.body.topic,req.body.count,req.body.lc]
 );

 res.json({});
});

app.post("/tracker/add/course", async (req,res)=>{
 if(!await allow(req.body.user,"course_logs"))
  return res.status(400).json({});

 await db.execute(
  "INSERT INTO course_logs(username,date,website,course,modules,minutes) VALUES(?,?,?,?,?,?)",
  [req.body.user,moment().format("YYYY-MM-DD"),
   req.body.site,req.body.name,req.body.mod,req.body.time]
 );

 res.json({});
});

app.post("/tracker/add/gym", async (req,res)=>{
 if(!await allow(req.body.user,"gym_logs"))
  return res.status(400).json({});

 await db.execute(
  "INSERT INTO gym_logs(username,date,went,minutes) VALUES(?,?,?,?)",
  [req.body.user,moment().format("YYYY-MM-DD"),
   req.body.went?1:0,req.body.time]
 );

 res.json({});
});

app.post("/tracker/feedback", async (req,res)=>{
 if(!await allow(req.body.user,"feedback"))
  return res.status(400).json({});

 await db.execute(
  "INSERT INTO feedback(username,message,date) VALUES(?,?,?)",
  [req.body.user,req.body.msg,
   moment().format("YYYY-MM-DD")]
 );

 res.json({});
});

// ---- READ ----
app.get("/tracker/my/:user", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM logs WHERE username=?",
  [req.params.user]
 );
 res.json(r);
});

app.get("/tracker/my/course/:user", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM course_logs WHERE username=?",
  [req.params.user]
 );
 res.json(r);
});

app.get("/tracker/my/gym/:user", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM gym_logs WHERE username=?",
  [req.params.user]
 );
 res.json(r);
});

app.get("/tracker/my/feedback/:user", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM feedback WHERE username=?",
  [req.params.user]
 );
 res.json(r);
});

// ---- HEATMAP ----
app.get("/tracker/heat/:user", async (req,res)=>{

 const [dsa] = await db.execute(
  "SELECT date FROM logs WHERE username=?",
  [req.params.user]
 );

 const [gym] = await db.execute(
  "SELECT date FROM gym_logs WHERE username=? AND went=1",
  [req.params.user]
 );

 const all=[...dsa,...gym].map(x=>x.date);
 const map={};

 all.forEach(d=>map[d]=(map[d]||0)+1);

 res.json(map);
});

// ---- ADMIN ----
app.get("/tracker/admin/users", async (req,res)=>{
 const [r] = await db.execute("SELECT username FROM users");
 res.json(r.map(x=>x.username));
});

app.get("/tracker/admin/user/:u", async (req,res)=>{

 const [dsa] = await db.execute(
  "SELECT * FROM logs WHERE username=?",[req.params.u]);

 const [gym] = await db.execute(
  "SELECT * FROM gym_logs WHERE username=?",[req.params.u]);

 const [course] = await db.execute(
  "SELECT * FROM course_logs WHERE username=?",[req.params.u]);

 const [fb] = await db.execute(
  "SELECT * FROM feedback WHERE username=?",[req.params.u]);

 res.json({dsa,gym,course,fb});
});

app.listen(3000,()=>console.log("running 3000"));
