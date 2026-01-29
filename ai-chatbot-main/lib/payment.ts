import crypto from 'crypto';

const MERCHANT_ACCOUNT = process.env.WAYFORPAY_ACCOUNT!;
const MERCHANT_SECRET = process.env.WAYFORPAY_SECRET!;
const MERCHANT_DOMAIN = "https://www.mydryiai.com.ua"; 

export function generatePaymentUrl(userId: string, userEmail: string) {
  const orderReference = `ORDER_${userId}_${Date.now()}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const amount = "40"; // Ціна 40 грн
  const currency = "UAH";
  const productName = "MudryiAI Premium";
  const productCount = "1";
  const productPrice = "40";

  // Поля для підпису (порядок суворо регламентований WayForPay)
  const signString = [
    MERCHANT_ACCOUNT,
    MERCHANT_DOMAIN,
    orderReference,
    orderDate,
    amount,
    currency,
    productName,
    productCount,
    productPrice
  ].join(';');

  const signature = crypto.createHmac('md5', MERCHANT_SECRET)
    .update(signString)
    .digest('hex');

  // Формуємо параметри URL
  const params = new URLSearchParams({
    merchantAccount: MERCHANT_ACCOUNT,
    merchantDomainName: MERCHANT_DOMAIN,
    merchantTransactionSecureType: "AUTO",
    orderReference: orderReference,
    orderDate: orderDate.toString(),
    amount: amount,
    currency: currency,
    productName: productName,
    productPrice: productPrice,
    productCount: productCount,
    clientEmail: userEmail,       // Передаємо email для автозаповнення
    clientAccountId: userId,      // Передаємо ID для активації через Webhook
    merchantSignature: signature,
    serviceUrl: `${MERCHANT_DOMAIN}/api/webhooks/wayforpay`, // Адреса вашого вебхука
    returnUrl: MERCHANT_DOMAIN,   // Куди повернути користувача
  });

  return `https://secure.wayforpay.com/pay?${params.toString()}`;
}