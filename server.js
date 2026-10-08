const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not configured. Configure PostgreSQL on Render before using V2.");
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

async function db(sql, params=[]) {
  if (!pool) throw new Error("DATABASE_URL não configurada.");
  return pool.query(sql, params);
}

async function initDb() {
  if (!pool) return;
  await db(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS movements (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('entrada','saida','investimento','comissao')),
      description TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      category TEXT DEFAULT 'Geral',
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS debts (
      id SERIAL PRIMARY KEY,
      person TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC(14,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const count = await db("SELECT COUNT(*)::int AS n FROM users");
  if (count.rows[0].n === 0) {
    const belo = await bcrypt.hash("Belo@258", 10);
    const backson = await bcrypt.hash("Backson@258", 10);
    await db(
      "INSERT INTO users(username,name,password_hash,role) VALUES($1,$2,$3,$4),($5,$6,$7,$8)",
      ["belo","Belo",belo,"admin","backson","Backson",backson,"member"]
    );
    await db("INSERT INTO settings(key,value) VALUES('weekly_goal','10000'),('belo_share','70'),('backson_share','30')");
  }
}

function auth(req,res,next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ","");
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({error:"Não autenticado."});
  }
}

app.post("/api/login", async (req,res) => {
  try {
    const {username,password} = req.body;
    const r = await db("SELECT id,username,name,password_hash,role FROM users WHERE username=$1",[username]);
    if (!r.rows[0] || !(await bcrypt.compare(password,r.rows[0].password_hash))) {
      return res.status(401).json({error:"Utilizador ou palavra-passe inválidos."});
    }
    const u=r.rows[0];
    const token=jwt.sign({id:u.id,username:u.username,name:u.name,role:u.role},JWT_SECRET,{expiresIn:"7d"});
    res.json({token,user:{id:u.id,username:u.username,name:u.name,role:u.role}});
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/dashboard", auth, async (req,res)=>{
  try{
    const r=await db(`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('entrada','investimento','comissao') THEN amount ELSE 0 END),0) AS entradas,
        COALESCE(SUM(CASE WHEN type='saida' THEN amount ELSE 0 END),0) AS saidas,
        COALESCE(SUM(CASE WHEN type='investimento' THEN amount ELSE 0 END),0) AS investimentos
      FROM movements`);
    const recent=await db("SELECT m.*,u.name AS user_name FROM movements m LEFT JOIN users u ON u.id=m.user_id ORDER BY m.created_at DESC LIMIT 20");
    const debts=await db("SELECT * FROM debts ORDER BY created_at DESC");
    const settings=await db("SELECT key,value FROM settings");
    const s=Object.fromEntries(settings.rows.map(x=>[x.key,x.value]));
    const total=Number(r.rows[0].entradas)-Number(r.rows[0].saidas);
    res.json({summary:{...r.rows[0],saldo:total},recent:recent.rows,debts:debts.rows,settings:s});
  }catch(e){res.status(500).json({error:e.message});}
});

app.post("/api/movements", auth, async (req,res)=>{
  try{
    const {type,description,amount,category}=req.body;
    if(!type||!description||!amount) return res.status(400).json({error:"Preencha os campos obrigatórios."});
    const r=await db(
      "INSERT INTO movements(type,description,amount,category,user_id) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [type,description,Number(amount),category||"Geral",req.user.id]
    );
    res.json(r.rows[0]);
  }catch(e){res.status(500).json({error:e.message});}
});

app.delete("/api/movements/:id", auth, async (req,res)=>{
  try{ await db("DELETE FROM movements WHERE id=$1",[req.params.id]); res.json({ok:true});}
  catch(e){res.status(500).json({error:e.message});}
});

app.post("/api/debts", auth, async (req,res)=>{
  try{
    const {person,description,amount}=req.body;
    const r=await db("INSERT INTO debts(person,description,amount) VALUES($1,$2,$3) RETURNING *",[person,description,Number(amount)]);
    res.json(r.rows[0]);
  }catch(e){res.status(500).json({error:e.message});}
});

app.patch("/api/debts/:id", auth, async (req,res)=>{
  try{
    await db("UPDATE debts SET status=$1 WHERE id=$2",[req.body.status,req.params.id]);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/me", auth, (req,res)=>res.json(req.user));

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

initDb().then(()=>app.listen(PORT,()=>console.log(`B&B Group Finance V2 running on ${PORT}`)))
  .catch(e=>{console.error(e); process.exit(1);});
