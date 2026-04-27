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
// 📱 CONFIG (WHATSAPP)
// =======================

// BUSCAR CONFIG
app.get("/config", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("config")
      .select("*")
      .eq("id", 1);

    if (error) throw error;

    // Se não existir
    if (!data || data.length === 0) {
      const { data: novo, error: erroInsert } = await supabase
        .from("config")
        .insert([{ id: 1, whatsapp: "5591999999999" }])
        .select();

      if (erroInsert) throw erroInsert;

      return res.json(novo[0]);
    }

    res.json(data[0]);

  } catch (err) {
    console.log("ERRO CONFIG:", err.message);
    res.status(500).json({ erro: "Erro ao buscar config" });
  }
});

// ATUALIZAR WHATSAPP
app.put("/config", async (req, res) => {
  try {
    let { whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ erro: "WhatsApp é obrigatório" });
    }

    // limpa caracteres
    whatsapp = whatsapp.replace(/\D/g, "");

    const { data, error } = await supabase
      .from("config")
      .update({ whatsapp })
      .eq("id", 1)
      .select();

    if (error) throw error;

    res.json(data[0]);

  } catch (err) {
    console.log("ERRO UPDATE CONFIG:", err.message);
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

  } catch (err) {
    console.log("ERRO PRODUTOS:", err.message);
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
      .select();

    if (error) throw error;

    res.json(data[0]);

  } catch (err) {
    console.log("ERRO CRIAR PRODUTO:", err.message);
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

  } catch (err) {
    console.log("ERRO DELETAR:", err.message);
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
      .select();

    if (error) throw error;

    res.json(data[0]);

  } catch (err) {
    console.log("ERRO PEDIDO:", err.message);
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

  } catch (err) {
    console.log("ERRO PEDIDOS:", err.message);
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
      .select();

    if (error) throw error;

    res.json(data[0]);

  } catch (err) {
    console.log("ERRO STATUS:", err.message);
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

// =======================
// 🚀 SERVER (CORREÇÃO RENDER)
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Sacolão API rodando na porta " + PORT);
});