// =======================
// 📱 CONFIG (WHATSAPP)
// =======================

// BUSCAR CONFIG
app.get("/config", async (req, res) => {
  try {
    let { data, error } = await supabase
      .from("config")
      .select("*")
      .eq("id", 1)
      .single();

    // Se não existir → cria automaticamente
    if (error || !data) {
      const result = await supabase
        .from("config")
        .upsert(
          [{ id: 1, whatsapp: "5591999999999" }],
          { onConflict: "id" }
        )
        .select()
        .single();

      if (result.error) throw result.error;

      data = result.data;
    }

    res.json(data);

  } catch (err) {
    console.log("ERRO CONFIG:", err);
    res.status(500).json({ erro: "Erro ao buscar config" });
  }
});

// ATUALIZAR WHATSAPP
app.put("/config", async (req, res) => {
  try {
    const { whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ erro: "WhatsApp é obrigatório" });
    }

    const { data, error } = await supabase
      .from("config")
      .upsert(
        [{ id: 1, whatsapp }],
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;

    res.json(data);

  } catch (err) {
    console.log("ERRO UPDATE CONFIG:", err);
    res.status(500).json({ erro: "Erro ao atualizar config" });
  }
});