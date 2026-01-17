import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

/* ---------- DB CONNECTION ---------- */
const db = await mysql.createConnection({
 host: process.env.DB_HOST,
 user: process.env.DB_USER,
 password: process.env.DB_PASS,
 database: process.env.DB_NAME,
 port: Number(process.env.DB_PORT),
 ssl:{ rejectUnauthorized:false }
});

/* ---------- 24 HOUR RULE ---------- */
async function canAdd(table, user){

 const [rows] = await db.execute(
  `SELECT date FROM ${table}
   WHERE username=? ORDER BY id DESC LIMIT 1`,
  [user]
 );

 // allow first ever entry
 if(rows.length === 0) return true;

 const last = new Date(rows[0].date);
 const now  = new Date();

 return (now - last)/(1000*60*60) >= 24;
}

/* ---------- AUTH ---------- */
app.post("/tracker/register", async (req,res)=>{
 const {email,password} = req.body;

 const hash = await bcrypt.hash(password,10);

 await db.execute(
  "INSERT INTO users VALUES (null,?,?,?)",
  [email,hash,"user"]
 );

 res.send("ok");
});

app.post("/tracker/login", async (req,res)=>{
 const {email,password} = req.body;

 const [u] = await db.execute(
  "SELECT * FROM users WHERE username=?",
  [email]
 );

 if(u.length===0) return res.status(400).send();

 const ok = await bcrypt.compare(
  password,u[0].password
 );

 if(!ok) return res.status(400).send();

 res.json({
  email:u[0].username,
  role:u[0].role
 });
});

/* ---------- DSA ---------- */
app.post("/tracker/add/dsa", async (req,res)=>{
 const {user,topic,count,lc} = req.body;

 if(!await canAdd("logs",user))
  return res.status(400).send();

 await db.execute(
  "INSERT INTO logs VALUES (null,?,?,?,?,?)",
  [user,new Date(),topic,count,lc]
 );

 res.send("ok");
});

app.get("/tracker/dsa/:u", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM logs WHERE username=?",
  [req.params.u]
 );
 res.json(r);
});

/* ---------- COURSE ---------- */
app.post("/tracker/add/course", async (req,res)=>{
 const {user,site,name,mod,time} = req.body;

 if(!await canAdd("course_logs",user))
  return res.status(400).send();

 await db.execute(
  "INSERT INTO course_logs VALUES (null,?,?,?,?,?,?)",
  [user,new Date(),site,name,mod,time]
 );

 res.send("ok");
});

app.get("/tracker/course/:u", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM course_logs WHERE username=?",
  [req.params.u]
 );
 res.json(r);
});

/* ---------- GYM ---------- */
app.post("/tracker/add/gym", async (req,res)=>{
 const {user,went,time} = req.body;

 if(!await canAdd("gym_logs",user))
  return res.status(400).send();

 await db.execute(
  "INSERT INTO gym_logs VALUES (null,?,?,?,?)",
  [user,new Date(),went,time]
 );

 res.send("ok");
});

app.get("/tracker/gym/:u", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM gym_logs WHERE username=?",
  [req.params.u]
 );
 res.json(r);
});

/* ---------- FEEDBACK ---------- */
app.post("/tracker/fb", async (req,res)=>{
 const {user,msg} = req.body;

 await db.execute(
  "INSERT INTO feedback VALUES (null,?,?,?,?)",
  [user,msg,"",new Date()]
 );

 res.send("ok");
});

app.get("/tracker/fb/:u", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT * FROM feedback WHERE username=?",
  [req.params.u]
 );
 res.json(r);
});

/* ---------- ADMIN ---------- */
app.get("/tracker/admin/users", async (req,res)=>{
 const [r] = await db.execute(
  "SELECT username FROM users"
 );
 res.json(r);
});

app.listen(3000,()=>console.log("running"));
