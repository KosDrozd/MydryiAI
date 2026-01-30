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

async function activatePremium() {
  const email = 'mudryiai@gmail.com';
  
  console.log(`\n🔄 Активуємо Premium для ${email}...`);
  
  await db
    .update(user)
    .set({
      isPremium: true,
      dailyMessageCount: 0,
      stripeCustomerId: 'TEST_PAYMENT_' + Date.now(),
    })
    .where(eq(user.email, email));
  
  console.log('✅ Premium активовано!');
  
  // Перевіряємо
  const result = await db.select().from(user).where(eq(user.email, email));
  const userData = result[0];
  
  console.log('\n📊 Статус користувача:');
  console.log(`📧 Email: ${userData.email}`);
  console.log(`💎 Premium: ${userData.isPremium ? 'ТАК ✅' : 'НІ ❌'}`);
  console.log(`📊 Daily Count: ${userData.dailyMessageCount}`);
  console.log(`🔑 Customer ID: ${userData.stripeCustomerId}`);
  
  process.exit(0);
}

activatePremium();
