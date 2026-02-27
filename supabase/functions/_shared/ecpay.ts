/**
 * ECPay CheckMacValue 共用工具
 * 用於產生和驗證綠界科技的 CheckMacValue
 */

export async function generateCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): Promise<string> {
  // 1. 過濾掉 CheckMacValue 本身
  const filtered = Object.entries(params).filter(
    ([key]) => key !== "CheckMacValue"
  );

  // 2. 按照 key 字母順序排序
  filtered.sort(([a], [b]) => a.localeCompare(b));

  // 3. 組成 query string 並前後加上 HashKey 和 HashIV
  const raw = `HashKey=${hashKey}&${filtered
    .map(([k, v]) => `${k}=${v}`)
    .join("&")}&HashIV=${hashIV}`;

  // 4. URL encode (轉小寫)
  let encoded = encodeURIComponent(raw).toLowerCase();

  // 5. 綠界特殊編碼規則
  encoded = encoded
    .replace(/%20/g, "+")
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%7e/g, "~");

  // 6. SHA256 雜湊，轉大寫
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(encoded)
  );
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function verifyCheckMacValue(
  params: Record<string, string>,
  hashKey: string,
  hashIV: string
): Promise<boolean> {
  const received = params.CheckMacValue;
  if (!received) return Promise.resolve(false);
  return generateCheckMacValue(params, hashKey, hashIV).then(
    (computed) => computed === received
  );
}

/**
 * 產生 ECPay 自動提交的 HTML 表單
 */
export function buildECPayFormHTML(
  params: Record<string, string>,
  actionUrl: string
): string {
  const inputs = Object.entries(params)
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${k}" value="${v.replace(/"/g, "&quot;")}" />`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>正在導向綠界付款...</title>
</head>
<body>
  <form id="ecpay-form" method="POST" action="${actionUrl}">
    ${inputs}
  </form>
  <script>document.getElementById('ecpay-form').submit();</script>
</body>
</html>`;
}

/**
 * 格式化日期為綠界要求的格式: yyyy/MM/dd HH:mm:ss
 */
export function formatECPayDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}
