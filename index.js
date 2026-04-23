const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 🔥 SUPABASE CONFIG
// =======================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// =======================
// 📁 MULTER (MEMÓRIA)
// =======================
const upload = multer({ storage: multer.memoryStorage() });

// =======================
// 👤 LOGIN
// =======================
const usuarios = [
  { id: 1, email: "admin@sacolao.com", senha: "123", tipo: "admin" },
  { id: 2, email: "cliente@teste.com", senha: "123", tipo: "cliente" }
];

app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    (u) => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ erro: "Login inválido" });
  }

  res.json(user);
});

// =======================
// 🥕 PRODUTOS
// =======================

// LISTAR
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.json(produtos);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: error.message });
  }
});

// CRIAR COM UPLOAD NO SUPABASE
app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { nome, preco } = req.body;

    let imagemUrl = null;

    if (req.file) {
      const fileName = Date.now() + "-" + req.file.originalname;

      // 🔥 upload para o bucket "produtos"
      const { error } = await supabase.storage
        .from("produtos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      // 🔥 gerar URL pública
      const { data } = supabase.storage
        .from("produtos")
        .getPublicUrl(fileName);

      imagemUrl = data.publicUrl;
    }

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        preco: Number(preco),
        imagem: imagemUrl
      }
    });

    res.json(novoProduto);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: error.message });
  }
});

// =======================
// 🧾 PEDIDOS
// =======================
app.post("/pedidos", async (req, res) => {
  try {
    const { nome, endereco, total } = req.body;

    const pedido = await prisma.pedido.create({
      data: {
        nome,
        endereco,
        total,
        status: "pendente"
      }
    });

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get("/pedidos", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// =======================
// 🚀 SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 API rodando");
});