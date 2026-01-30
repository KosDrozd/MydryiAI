import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '../lib/db/schema.ts';
import { eq } from 'drizzle-orm';

// Завантажуємо .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ POSTGRES_URL не знайдено');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkUser() {
  const result = await db.select().from(user).where(eq(user.email, 'mudryiai@gmail.com'));
  
  if (result.length > 0) {
    const userData = result[0];
    console.log('\n✅ Користувач знайдено:');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🆔 ID: ${userData.id}`);
    console.log(`💎 Premium: ${userData.isPremium ? 'ТАК ✅' : 'НІ ❌'}`);
    console.log(`📊 Daily Count: ${userData.dailyMessageCount}`);
    console.log(`📅 Last Message: ${userData.lastMessageDate}`);
    console.log(`🔑 Stripe Customer ID: ${userData.stripeCustomerId || 'N/A'}`);
  } else {
    console.log('❌ Користувача не знайдено');
  }
  
  process.exit(0);
}

checkUser();
