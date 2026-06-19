export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { page, menu, message, createdAt } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ error: "Telegram config missing" });
  }

  const text = [
    "📬 <b>새 문의가 도착했습니다</b>",
    "",
    `📂 메뉴: ${menu}`,
    `📄 페이지: ${page}`,
    `💬 내용:\n${message}`,
    "",
    `🕐 ${new Date(createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  });

  if (!response.ok) {
    return res.status(500).json({ error: "Telegram send failed" });
  }

  return res.status(200).json({ ok: true });
}
