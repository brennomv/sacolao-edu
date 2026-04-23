const multer = require("multer");
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// =======================
// 📁 UPLOAD CONFIG
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// server imagens
app.use("/uploads", express.static("uploads"));

// =======================
// 👤 USUÁRIOS (LOGIN SIMPLES)
// =======================
const usuarios = [
  {
    id: 1,
    email: "admin@sacolao.com",
    senha: "123",
    tipo: "admin"
  },
  {
    id: 2,
    email: "cliente@teste.com",
    senha: "123",
    tipo: "cliente"
  }
];

// =======================
// 🔐 LOGIN
// =======================
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  const user = usuarios.find(
    (u) => u.email === email && u.senha === senha
  );

  if (!user) {
    return res.status(401).json({ erro: "Login inválido" });
  }

  return res.json({
    id: user.id,
    email: user.email,
    tipo: user.tipo
  });
});

// =======================
// 🥕 PRODUTOS (PRISMA)
// =======================

// LISTAR
app.get("/produtos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany();
    res.json(produtos);
  } catch (error) {
    console.log("ERRO REAL:", error);
    res.status(500).json({ erro: error.message });
  }
});

// CRIAR COM UPLOAD DE IMAGEM
app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const { nome, preco } = req.body;

    const imagem = req.file
      ? `https://sacolao-api.onrender.com/uploads/${req.file.filename}`
      : null;

    const novoProduto = await prisma.produto.create({
      data: {
        nome,
        preco: Number(preco),
        imagem
      }
    });

    res.json(novoProduto);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

// =======================
// 🧾 PEDIDOS (PRISMA)
// =======================

// CRIAR PEDIDO
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
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

// LISTAR PEDIDOS
app.get("/pedidos", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany();
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar pedidos" });
  }
});

// ATUALIZAR STATUS
app.put("/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pedido = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { status }
    });

    res.json(pedido);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar pedido" });
  }
});

// =======================
// 🚀 SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 Sacolão do Edu rodando em http://sacolao-api.onrender.com");
});