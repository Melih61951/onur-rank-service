const express = require("express");

const app = express();
app.use(express.json());

const GROUP_ID = process.env.GROUP_ID;
const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

async function robloxRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ROBLOX_API_KEY,
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function readList(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
}

function readId(resource) {
  if (resource.path) {
    return resource.path.split("/").pop();
  }

  if (resource.name) {
    return resource.name.split("/").pop();
  }

  if (resource.id) {
    return String(resource.id);
  }

return null;
}

async function getRoleResource(rankNumber) {
  const data = await robloxRequest(
    `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/roles`
  );

  const roles = readList(data, ["groupRoles", "roles", "data"]);
  const role = roles.find((item) => Number(item.rank) === Number(rankNumber));

  if (!role) {
    throw new Error(`Bu rank numarası için role bulunamadı: ${rankNumber}`);
  }

  if (role.path) {
    return role.path;
  }

  if (role.name && role.name.includes("/roles/")) {
    return role.name;
  }

  const roleId = readId(role);
  if (!roleId) {
    throw new Error("Role ID okunamadı.");
  }

  return `groups/${GROUP_ID}/roles/${roleId}`;
}

async function getMembershipId(userId) {
  const filter = encodeURIComponent(`user == 'users/${userId}'`);

  const data = await robloxRequest(
    `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/memberships?filter=${filter}&maxPageSize=10`
  );

  const memberships = readList(data, ["groupMemberships", "memberships", "data"]);
  const membership = memberships[0];

  if (!membership) {
    throw new Error("Oyuncu grupta değil.");
  }

  const membershipId = readId(membership);
  if (!membershipId) {
    throw new Error("Membership ID okunamadı.");
  }

  return membershipId;
}

async function setGroupRank(userId, rankNumber) {
  const role = await getRoleResource(rankNumber);
  const membershipId = await getMembershipId(userId);

  await robloxRequest(
    `https://apis.roblox.com/cloud/v2/groups/${GROUP_ID}/memberships/${membershipId}:assignRole`,
    {
      method: "POST",
      body: JSON.stringify({
        role
      })
    }
  );

  return true;
}

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

    await setGroupRank(Number(userId), Number(rank));

    res.json({
      success: true,
      message: "Rütbe başarıyla verildi."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Rank service ${port} portunda çalışıyor.`);
});
