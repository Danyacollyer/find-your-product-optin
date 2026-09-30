module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
  const email = String(body.email || "").trim().toLowerCase();
  const firstName = String(body.first_name || "").trim().slice(0, 80);

  if (body.website) return res.status(200).json({ ok: true });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const key = (process.env.FLODESK_API_KEY || "").trim();
  const segment = (process.env.FLODESK_SEGMENT_ID || "").trim();
  if (!key || !segment) {
    return res.status(500).json({ error: "Signup isn't configured yet." });
  }

  try {
    const r = await fetch("https://api.flodesk.com/v1/subscribers", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(key + ":").toString("base64"),
        "Content-Type": "application/json",
        "User-Agent": "Danya Collyer Opt-in (danyacollyer.com)"
      },
      body: JSON.stringify({ email, first_name: firstName, segment_ids: [segment] })
    });
    if (!r.ok) {
      console.error("Flodesk error", r.status, await r.text());
      return res.status(502).json({ error: "Something went wrong. Please try again." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Something went wrong. Please try again." });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
