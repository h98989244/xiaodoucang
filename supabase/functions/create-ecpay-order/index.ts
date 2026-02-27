import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateCheckMacValue,
  buildECPayFormHTML,
  formatECPayDate,
} from "../_shared/ecpay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_label: string;
  price: number;
  quantity: number;
  image: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  payment_method: "Credit" | "ATM" | "CVS";
  email: string;
  user_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, payment_method, email, user_id } =
      (await req.json()) as CreateOrderRequest;

    // 驗證必填欄位
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "購物車是空的" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!email) {
      return new Response(
        JSON.stringify({ error: "請提供電子郵件" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 初始化 Supabase（使用 service role key 以繞過 RLS）
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ECPay 設定
    const merchantId = Deno.env.get("ECPAY_MERCHANT_ID") || "3002607";
    const hashKey = Deno.env.get("ECPAY_HASH_KEY") || "pwFHCqoQZGmho4w6";
    const hashIV = Deno.env.get("ECPAY_HASH_IV") || "EkRm7iFT261dpevs";
    const ecpayUrl =
      Deno.env.get("ECPAY_API_URL") ||
      "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";
    const frontendUrl =
      Deno.env.get("FRONTEND_URL") || "https://www.sdccardshop.com";

    // 伺服器端驗證價格：查詢資料庫中的實際價格
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .select("id, price, stock, label")
      .in("id", variantIds);

    if (variantError || !variants) {
      return new Response(
        JSON.stringify({ error: "無法驗證商品資訊" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 建立 variant 查詢 map
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 驗證庫存和價格
    const verifiedItems = [];
    for (const item of items) {
      const dbVariant = variantMap.get(item.variant_id);
      if (!dbVariant) {
        return new Response(
          JSON.stringify({ error: `商品不存在：${item.product_name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (dbVariant.stock < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `庫存不足：${item.product_name}（${item.variant_label}），剩餘 ${dbVariant.stock} 件`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // 使用資料庫中的價格（不信任前端）
      verifiedItems.push({
        ...item,
        price: dbVariant.price,
      });
    }

    // 計算伺服器端總金額
    const serverTotal = verifiedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 產生訂單編號（最多 20 字元）
    const orderNo = `ORD${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    // 透過 RPC 呼叫 Postgres Function 原子性建立訂單
    const { data: orderId, error: rpcError } = await supabase.rpc(
      "checkout_create_order",
      {
        p_items: verifiedItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          product_name: i.product_name,
          variant_label: i.variant_label,
          price: i.price,
          quantity: i.quantity,
        })),
        p_order_no: orderNo,
        p_user_id: user_id || null,
        p_email: email,
        p_total: serverTotal,
        p_payment_method: payment_method,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      const msg = rpcError.message.includes("Insufficient stock")
        ? "商品庫存不足，請重新確認購物車"
        : "建立訂單失敗，請稍後再試";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 記錄 payment log
    await supabase.from("payment_logs").insert({
      order_id: orderId,
      order_no: orderNo,
      action: "create",
      raw_data: { items: verifiedItems, payment_method, email, user_id },
    });

    // 組合 ECPay 商品名稱（用 # 分隔）
    const itemName = verifiedItems
      .map((i) => `${i.product_name} ${i.variant_label} x${i.quantity}`)
      .join("#");

    // 組合 ECPay 參數
    const tradeDate = formatECPayDate(new Date());
    const callbackUrl = `${supabaseUrl}/functions/v1/ecpay-callback`;

    const ecpayParams: Record<string, string> = {
      MerchantID: merchantId,
      MerchantTradeNo: orderNo,
      MerchantTradeDate: tradeDate,
      PaymentType: "aio",
      TotalAmount: Math.round(serverTotal).toString(),
      TradeDesc: encodeURIComponent("小豆倉點卡商城"),
      ItemName: itemName,
      ReturnURL: callbackUrl,
      OrderResultURL: `${frontendUrl}/checkout/result?order_no=${orderNo}`,
      ChoosePayment: payment_method,
      EncryptType: "1",
      NeedExtraPaidInfo: "Y",
    };

    // 產生 CheckMacValue
    ecpayParams.CheckMacValue = await generateCheckMacValue(
      ecpayParams,
      hashKey,
      hashIV
    );

    // 產生自動提交的 HTML 表單
    const html = buildECPayFormHTML(ecpayParams, ecpayUrl);

    return new Response(
      JSON.stringify({ html, order_no: orderNo }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "系統錯誤，請稍後再試" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
