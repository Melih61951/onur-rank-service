const express = require("express");

const app = express();
app.use(express.json());

const GROUP_ID = process.env.GROUP_ID;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

app.get("/", (req, res) => {
  res.json({ success: true, message: "Rank service çalışıyor." });
});

app.post("/rank", async (req, res) => {
  try {
    const { secret, userId, rank } = req.body;

    if (secret !== SERVICE_SECRET) {
      return res.status(403).json({ success: false, message: "Yetkisiz istek." });
    }

    if (!userId || !rank) {
      return res.status(400).json({ success: false, message: "userId veya rank eksik." });
    }

    console.log("Rütbe isteği geldi:", {
      groupId: GROUP_ID,
      userId,
      rank
    });

    res.json({
      success: true,
      message: "Test başarılı. Open Cloud rütbe verme kısmı sonraki adım."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Rank service ${port} portunda çalışıyor.`);
});
