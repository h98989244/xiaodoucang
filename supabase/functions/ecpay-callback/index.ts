import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verifyCheckMacValue } from "../_shared/ecpay.ts";

serve(async (req) => {
  try {
    // ECPay 以 form-urlencoded POST 傳送回呼
    const body = await req.text();
    const params: Record<string, string> = {};
    for (const pair of body.split("&")) {
      const [key, ...valueParts] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(
        valueParts.join("=")
      );
    }

    console.log("ECPay callback received:", JSON.stringify(params));

    // ECPay 設定
    const hashKey = Deno.env.get("ECPAY_HASH_KEY") || "pwFHCqoQZGmho4w6";
    const hashIV = Deno.env.get("ECPAY_HASH_IV") || "EkRm7iFT261dpevs";

    // 驗證 CheckMacValue
    const isValid = await verifyCheckMacValue(params, hashKey, hashIV);
    if (!isValid) {
      console.error("CheckMacValue verification failed");
      return new Response("0|CheckMacValue Error", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 初始化 Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderNo = params.MerchantTradeNo;
    const rtnCode = params.RtnCode;
    const tradeNo = params.TradeNo || "";
    const paymentDate = params.PaymentDate || null;

    // 查詢訂單
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("order_no", orderNo)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderNo);
      return new Response("0|OrderNotFound", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 避免重複處理已完成的訂單
    if (order.payment_status === "paid") {
      return new Response("1|OK", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 更新訂單狀態
    if (rtnCode === "1") {
      // 付款成功
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "completed",
          ecpay_trade_no: tradeNo,
          payment_date: paymentDate
            ? new Date(paymentDate.replace(/\//g, "-")).toISOString()
            : new Date().toISOString(),
        })
        .eq("id", order.id);
    } else {
      // 付款失敗
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          ecpay_trade_no: tradeNo,
        })
        .eq("id", order.id);
    }

    // 記錄 payment log
    await supabase.from("payment_logs").insert({
      order_id: order.id,
      order_no: orderNo,
      action: "callback",
      raw_data: params,
    });

    // ECPay 要求回傳 1|OK 表示成功接收
    return new Response("1|OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response("0|Error", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
});
