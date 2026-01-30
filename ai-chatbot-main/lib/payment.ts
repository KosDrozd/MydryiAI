import crypto from 'crypto';

const MERCHANT_ACCOUNT = process.env.WAYFORPAY_ACCOUNT!;
const MERCHANT_SECRET = process.env.WAYFORPAY_SECRET!; 

export interface PaymentFormData {
  merchantAccount: string;
  merchantDomainName: string;
  merchantTransactionSecureType: string;
  orderReference: string;
  orderDate: string;
  amount: string;
  currency: string;
  productName: string[];
  productPrice: string[];
  productCount: string[];
  clientEmail: string;
  clientAccountId: string;
  merchantSignature: string;
  serviceUrl: string;
  returnUrl: string;
}

export function generatePaymentData(
  userId: string,
  userEmail: string,
  baseUrl: string
): PaymentFormData {
  const orderReference = `ORDER_${userId}_${Date.now()}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const amount = "1"; // Ціна 1 грн для тестування
  const currency = "UAH";
  const productName = "MudryiAI Premium";
  const productCount = "1";
  const productPrice = "1";

  // Поля для підпису (порядок суворо регламентований WayForPay)
  const signString = [
    MERCHANT_ACCOUNT,
    baseUrl,
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

  // Повертаємо дані для POST форми
  return {
    merchantAccount: MERCHANT_ACCOUNT,
    merchantDomainName: baseUrl,
    merchantTransactionSecureType: "AUTO",
    orderReference: orderReference,
    orderDate: orderDate.toString(),
    amount: amount,
    currency: currency,
    productName: [productName],
    productPrice: [productPrice],
    productCount: [productCount],
    clientEmail: userEmail,
    clientAccountId: userId,
    merchantSignature: signature,
    serviceUrl: `${baseUrl}/api/webhooks/wayforpay`,
  };
}