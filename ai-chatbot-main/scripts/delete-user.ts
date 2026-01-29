import { config } from 'dotenv';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  user, 
  chat, 
  message, 
  messageDeprecated,
  vote,
  voteDeprecated,
  document,
  suggestion,
  stream
} from '../lib/db/schema';

// Завантажуємо .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Створюємо підключення до БД
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ POSTGRES_URL не знайдено в .env.local');
  process.exit(1);
}

console.log('✅ Підключення до БД:', connectionString.substring(0, 50) + '...');
const client = postgres(connectionString);
const db = drizzle(client);

async function deleteUserData(email: string) {
  console.log(`🔍 Шукаємо користувача з email: ${email}`);
  
  // Знайти користувача
  const userRecord = await db.select().from(user).where(eq(user.email, email)).limit(1);
  
  if (userRecord.length === 0) {
    console.log('❌ Користувача не знайдено');
    return;
  }
  
  const userId = userRecord[0].id;
  console.log(`✅ Знайдено користувача: ${userId}`);
  console.log(`📊 Статистика: Premium=${userRecord[0].isPremium}, Messages=${userRecord[0].dailyMessageCount}`);
  
  // Знайти всі чати користувача
  const userChats = await db.select().from(chat).where(eq(chat.userId, userId));
  const chatIds = userChats.map(c => c.id);
  
  console.log(`\n📝 Знайдено чатів: ${chatIds.length}`);
  
  if (chatIds.length > 0) {
    // Видалити голоси (Vote_v2)
    const votesDeleted = await db.delete(vote).where(eq(vote.chatId, chatIds[0]));
    console.log(`🗑️  Видалено голосів (Vote_v2)`);
    
    // Видалити старі голоси (Vote)
    const oldVotesDeleted = await db.delete(voteDeprecated).where(eq(voteDeprecated.chatId, chatIds[0]));
    console.log(`🗑️  Видалено старих голосів (Vote)`);
    
    // Видалити повідомлення (Message_v2)
    for (const chatId of chatIds) {
      await db.delete(message).where(eq(message.chatId, chatId));
    }
    console.log(`🗑️  Видалено повідомлень (Message_v2)`);
    
    // Видалити старі повідомлення (Message)
    for (const chatId of chatIds) {
      await db.delete(messageDeprecated).where(eq(messageDeprecated.chatId, chatId));
    }
    console.log(`🗑️  Видалено старих повідомлень (Message)`);
    
    // Видалити стріми
    for (const chatId of chatIds) {
      await db.delete(stream).where(eq(stream.chatId, chatId));
    }
    console.log(`🗑️  Видалено стрімів (Stream)`);
  }
  
  // Видалити пропозиції (Suggestion)
  await db.delete(suggestion).where(eq(suggestion.userId, userId));
  console.log(`🗑️  Видалено пропозицій (Suggestion)`);
  
  // Видалити документи (Document)
  await db.delete(document).where(eq(document.userId, userId));
  console.log(`🗑️  Видалено документів (Document)`);
  
  // Видалити чати
  await db.delete(chat).where(eq(chat.userId, userId));
  console.log(`🗑️  Видалено чатів (Chat)`);
  
  // Видалити користувача
  await db.delete(user).where(eq(user.id, userId));
  console.log(`✅ Видалено користувача (User)`);
  
  console.log(`\n✨ Всі дані для ${email} успішно видалено!`);
  process.exit(0);
}

// Запуск
const emailToDelete = process.argv[2] || 'mudryiai@gmail.com';
deleteUserData(emailToDelete).catch((error) => {
  console.error('❌ Помилка:', error);
  process.exit(1);
});
