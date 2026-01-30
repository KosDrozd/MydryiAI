import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generatePaymentData } from "@/lib/payment";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const userId = session.user.id!;
  const userEmail = session.user.email!;

  // Отримуємо baseUrl з поточного запиту
  const baseUrl = new URL(request.url).origin;

  // Генеруємо дані для форми оплати з динамічним baseUrl
  const paymentData = generatePaymentData(userId, userEmail, baseUrl);

  return NextResponse.json(paymentData);
}
