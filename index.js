const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

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
// ⚙️ CONFIG (WHATSAPP)
// =======================

// GET CONFIG
app.get("/config", async (req, res) => {
  try {
    let { data, error } = await supabase
      .from("config")
      .select("*")
      .eq("id", 1)
      .single();

    // se não existir, cria automaticamente
    if (!data) {
      const result = await supabase
        .from("config")
        .insert([{ id: 1, whatsapp: "5591999999999" }])
        .select()
        .single();

      data = result.data;
    }

    res.json(data);

  } catch (error) {
    console.log("ERRO CONFIG:", error);
    res.status(500).json({ erro: "Erro ao buscar config" });
  }
});

// UPDATE CONFIG
app.put("/config", async (req, res) => {
  try {
    const { whatsapp } = req.body;

    const { data, error } = await supabase
      .from("config")
      .update({ whatsapp })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.log("ERRO UPDATE CONFIG:", error);
    res.status(500).json({ erro: "Erro ao atualizar config" });
  }
});

// =======================
// 🥕 PRODUTOS
// =======================

// LISTAR
app.get("/produtos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data);

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

      const { error } = await supabase.storage
        .from("produtos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("produtos")
        .getPublicUrl(fileName);

      imagemUrl = data.publicUrl;
    }

    const { data, error } = await supabase
      .from("produtos")
      .insert([
        {
          nome,
          preco: Number(preco),
          imagem: imagemUrl
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.log("ERRO CRIAR PRODUTO:", error);
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

// DELETAR
app.delete("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("produtos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Produto deletado com sucesso" });

  } catch (error) {
    console.log("ERRO DELETAR:", error);
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

    const { data, error } = await supabase
      .from("pedidos")
      .insert([
        {
          nome,
          endereco,
          total,
          status: "pendente"
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.log("ERRO PEDIDO:", error);
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

// LISTAR
app.get("/pedidos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.log("ERRO PEDIDOS:", error);
    res.status(500).json({ erro: "Erro ao buscar pedidos" });
  }
});

// ATUALIZAR STATUS
app.put("/pedidos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("pedidos")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (error) {
    console.log("ERRO STATUS:", error);
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

// =======================
// 🚀 SERVER
// =======================
app.listen(3000, () => {
  console.log("🚀 Sacolão API rodando na porta 3000");
});