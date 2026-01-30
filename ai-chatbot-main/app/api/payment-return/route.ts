import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderReference = searchParams.get("orderReference");
  const transactionStatus = searchParams.get("transactionStatus");

  console.log("[WAYFORPAY_RETURN] GET:", {
    orderReference,
    transactionStatus,
    fullUrl: request.url,
  });

  // Повертаємо HTML сторінку з редіректом
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=/payment-success">
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Redirecting to payment success page...</p>
        <a href="/payment-success">Click here if not redirected</a>
      </body>
    </html>
  `, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  console.log("[WAYFORPAY_RETURN] POST body:", body);

  // Повертаємо HTML сторінку з редіректом
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=/payment-success">
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Redirecting to payment success page...</p>
        <a href="/payment-success">Click here if not redirected</a>
      </body>
    </html>
  `, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
