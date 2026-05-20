const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const fetch = require("node-fetch");
const OpenAI = require("openai");
require("dotenv").config();
const app = express();
const port = 5000;
const PYTHON_API = "http://127.0.0.1:7000/generate";

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/video_api", express.static(path.join(__dirname, "public", "video_api")));

app.use(
  session({
    secret: "my_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ MySQL connected!");
});

const uploadPath = path.join(__dirname, "public", "uploads");
const pdfPath = path.join(__dirname, "public", "pdfs");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
if (!fs.existsSync(pdfPath)) fs.mkdirSync(pdfPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) =>
    cb(null, "profile_" + Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

let latestTopics = [];

app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/auth");
  res.redirect("/dashboard");
});


app.get("/auth", (req, res) => res.render("auth", { error: null }));

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.render("auth", { error: "All fields required!" });

  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashed],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.render("auth", { error: "User already exists!" });
        return res.render("auth", { error: "Database error." });
      }
      res.render("auth", { error: "✅ Registered successfully! Please login." });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.render("auth", { error: "Enter email and password" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
    if (err) return res.render("auth", { error: "Database error" });
    if (rows.length === 0)
      return res.render("auth", { error: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.render("auth", { error: "Invalid password" });

    req.session.user = user;
    res.redirect("/work");
  });
});

app.post("/update-profile", upload.single("profile_pic"), (req, res) => {
  if (!req.session.user) return res.redirect("/auth");
  const { username } = req.body;
  const email = req.session.user.email;
  const file = req.file ? req.file.filename : req.session.user.profile_pic;

  db.query(
    "UPDATE users SET username = ?, profile_pic = ? WHERE email = ?",
    [username, file, email],
    (err) => {
      if (err) console.error(err);
      db.query("SELECT * FROM users WHERE email = ?", [email], (e, rows) => {
        req.session.user = rows[0];
        res.redirect("/dashboard");
      });
    }
  );
});

app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/auth")));

app.get("/form", (req, res) => {
  if (!req.session.user) return res.redirect("/auth");
res.render("form", {
    user: req.session.user
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/work", (req, res) => {
  res.render("work");
});

app.get("/index", (req, res) => {
  res.render("index");
});

app.get("/list", (req, res) => {
  res.render("list",{
    user: req.session.user
  });
});


app.post("/generate-roadmap", async (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const userPrompt = req.body.prompt;
  const level = req.body.level;

  if (!userPrompt) return res.send("Prompt required");

  try {
    console.log("➡️ Sending prompt + level to Python API...");

    const response = await fetch(PYTHON_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt, level })
    });

    const data = await response.json();
    latestTopics = data.topics || [];

    const topicsStr = latestTopics.join(", "); 

    db.query(
      "INSERT INTO history (user_id, prompt, topics, level) VALUES (?, ?, ?, ?)",
      [req.session.user.id, userPrompt, topicsStr, level],
      (err) => {
        if (err) console.error("DB save error:", err);
      }
    );

    res.render("index", { topics: latestTopics });

  } catch (err) {
    console.error("❌ Flask API error:", err);
    res.render("index", { topics: [] });
  }
});




app.post("/save-pdf", (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  const { pdfData } = req.body;
  if (!pdfData) return res.status(400).send("Missing PDF data");

  try {
    const pdfBuffer = Buffer.from(pdfData.split(",")[1], "base64");
    const fileName = `roadmap-${Date.now()}.pdf`;
    const relativePath = `pdfs/${fileName}`;
    const absolutePath = path.join(__dirname, "public", relativePath);

    fs.writeFileSync(absolutePath, pdfBuffer);
    console.log(`✅ PDF saved: ${absolutePath}`);

    db.query(
      `UPDATE history 
       SET pdf_file = ? 
       WHERE id = (
         SELECT id FROM (
           SELECT id FROM history 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1
         ) AS t
       )`,
      [relativePath, req.session.user.id],
      (err) => {
        if (err) console.error("DB update error:", err);
        res.json({ success: true, path: relativePath });
      }
    );

  } catch (err) {
    console.error("❌ Error saving PDF:", err);
    res.status(500).send("Error saving PDF");
  }
});
app.get("/learn-more", (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const topic = req.query.topic || "No topic received";

  res.render("learn_more", {
    topic,
    user: req.session.user
  });
});



app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/auth");

  const user = req.session.user;

  db.query(
    "SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC",
    [user.id],
    (err, history) => {
      if (err) history = [];

      const totalOutputs = history.length;
      const totalDownloads = history.reduce((sum, item) => sum + (item.downloads || 0), 0);

      res.render("dashboard", { user, history, totalOutputs, totalDownloads });
    }
  );
});



app.get("/download/:id", (req, res) => {
  if (!req.session.user) return res.redirect("/auth");
  const id = req.params.id;

  db.query(
    "SELECT pdf_file FROM history WHERE id = ? AND user_id = ?",
    [id, req.session.user.id],
    (err, rows) => {
      if (err || rows.length === 0)
        return res.status(404).send("PDF not found.");

      const record = rows[0];
      const filePath = path.join(__dirname, "public", record.pdf_file);

      if (!fs.existsSync(filePath))
        return res.status(404).send("File missing on server.");

      db.query(
        "UPDATE history SET downloads = downloads + 1 WHERE id = ?",
        [id],
        () => { }
      );

      res.download(filePath, path.basename(filePath));
    }
  );
});

app.get("/roadmap", (req, res) => res.json(latestTopics));

const client = new OpenAI({
  apiKey:process.env.apiKey
});
app.post("/generate-topic", async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `
You are a JSON API.

Return ONLY valid JSON for the topic "${topic}"

STRICT RULES:
- Output must be PURE JSON only
- No markdown
- No emojis
- No explanations
- No comments
- No extra text
- No missing fields
- Use simple beginner-friendly English
- Use integers only for learning_time values
- Follow the exact structure below

REQUIRED JSON FORMAT:

{
  "definition": "One short, clear, beginner-friendly definition of the topic.",

  "steps": [
    "Step 1: Explain how the topic starts working",
    "Step 2: Explain the next internal process",
    "Step 3: Explain the next process",
    "Step 4: Explain the next process",
    "Step 5: Explain the final outcome"
  ],

  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3",
    "Feature 4",
    "Feature 5"
  ],

  "script": "Write a short explanation in 1 to 2 paragraphs.
Explain what the topic is, why it is important, where it is used,
and include one simple real-world analogy for beginners.",

  "learning_time": {
    "beginner": 0,
    "intermediate": 0,
    "advanced": 0
  }
}
`;

    const response = await client.responses.create({
      model: "gpt-5-nano",
      input: prompt
    });

    const clean = JSON.parse(response.output_text.trim());

    res.json({
      definition: clean.definition,
      script: clean.script,
      nodes: clean.steps.map(s => ({ name: s })),
      features: clean.features,
      learning_time: clean.learning_time
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      definition: "Error generating topic",
      nodes: [],
      features: [],
      learning_time: {}
    });
  }
});


app.post("/generate-video", async (req, res) => {
  try {
    const flaskRes = await fetch("http://127.0.0.1:7001/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await flaskRes.json();
    res.json(data);
  } catch (err) {
    console.error("Flask not running:", err.message);
    res.status(500).json({ success: false });
  }
});

app.get("/learn-more", (req, res) => {
  res.render("learn_more", { topic: req.query.topic || "" });
});

app.get("/learn/:topic", (req, res) => {
  res.render("learn_more", { topic: req.params.topic });
});


app.listen(port, () => {
  console.log(`🚀 Express running: http://127.0.0.1:${port}`);
});
