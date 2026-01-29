// app/api/webhooks/wayforpay/route.ts
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema'; // Увага: імпорт 'user', не 'users' (згідно твого schema.ts)
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const SECRET_KEY = process.env.WAYFORPAY_SECRET!;

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    let data;

    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      const params = new URLSearchParams(bodyText);
      data = Object.fromEntries(params);
    }

    console.log("💰 Webhook:", data.orderReference, data.transactionStatus);

    if (data.transactionStatus === 'Approved') {
      // ПРІОРИТЕТ 1: Шукаємо по ID (clientAccountId), який ми передали при генерації
      const userId = data.clientAccountId;
      
      // ПРІОРИТЕТ 2: Якщо раптом ID немає, шукаємо по email
      const userEmail = data.email;

      if (userId) {
         await db.update(user)
          .set({ isPremium: true, stripeCustomerId: data.orderReference })
          .where(eq(user.id, userId)); // Оновлення по ID
          console.log(`✅ Premium (by ID) for: ${userId}`);
      } else if (userEmail) {
         await db.update(user)
          .set({ isPremium: true, stripeCustomerId: data.orderReference })
          .where(eq(user.email, userEmail)); // Оновлення по Email
          console.log(`✅ Premium (by Email) for: ${userEmail}`);
      }
    }

    // Відповідь для WayForPay
    const time = Math.floor(Date.now() / 1000);
    const orderReference = data.orderReference;
    const status = "accept";
    const signString = [orderReference, status, time].join(';');
    const signature = crypto.createHmac('md5', SECRET_KEY).update(signString).digest('hex');

    return new Response(JSON.stringify({
      orderReference, status, time, signature
    }), { status: 200 });

  } catch (err: any) {
    console.error("❌ Webhook Error:", err);
    return new Response(`Error: ${err.message}`, { status: 400 });
  }
}