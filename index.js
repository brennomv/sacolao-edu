const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const app = express();

// =======================
// ⚙️ CONFIG BÁSICA
// =======================
app.use(cors());
app.use(express.json());

// =======================
// 🔥 VALIDAR ENV
// =======================
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error("❌ Variáveis do Supabase não configuradas");
}

// =======================
// 🔥 SUPABASE
// =======================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// =======================
// 📁 UPLOAD CONFIG
// =======================
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  }
});

// =======================
// 👤 LOGIN SIMPLES
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
    const produtos = await prisma.produto.findMany({
      orderBy: { id: "desc" }
    });

    res.json(produtos);
  } catch (error) {
    console.log("ERRO PRODUTOS:", error);
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

// CRIAR
app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { nome, preco } = req.body;

    if (!nome || !preco) {
      return res.status(400).json({ erro: "Nome e preço são obrigatórios" });
    }

    let imagemUrl = null;

    if (req.file) {
      const fileName =
        Date.now() + "-" + req.file.originalname.replace(/\s/g, "");

      // upload
      const { error } = await supabase.storage
        .from("produtos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      // url pública
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
    console.log("ERRO CRIAR PRODUTO:", error);
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

// DELETAR PRODUTO 🔥
app.delete("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.produto.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Produto deletado com sucesso" });

  } catch (error) {
    console.log("ERRO DELETAR PRODUTO:", error);
    res.status(500).json({ erro: "Erro ao deletar produto" });
  }
});

// =======================
// 🧾 PEDIDOS
// =======================

// CRIAR
app.post("/pedidos", async (req, res) => {
  try {
    const { nome, endereco, total } = req.body;

    if (!nome || !endereco || !total) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

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
    console.log("ERRO PEDIDO:", error);
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

// LISTAR
app.get("/pedidos", async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { id: "desc" }
    });

    res.json(pedidos);
  } catch (error) {
    console.log("ERRO PEDIDOS:", error);
    res.status(500).json({ erro: "Erro ao buscar pedidos" });
  }
});

// ATUALIZAR STATUS 🔥
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
    console.log("ERRO ATUALIZAR STATUS:", error);
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

// =======================
// 🚀 SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 Sacolão API rodando na porta 3000");
});