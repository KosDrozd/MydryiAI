export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: "log",
  chat: "response",
  auth: "response",
  stream: "response",
  api: "response",
  history: "response",
  vote: "response",
  document: "response",
  suggestions: "response",
  activate_gateway: "response",
};

export class ChatSDKError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(":");

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === "log") {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: "", message: "Щось пішло не так. Будь ласка, спробуйте ще раз пізніше." },
        { status: statusCode }
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes("database")) {
    return "Під час виконання запиту до бази даних сталася помилка.";
  }

  switch (errorCode) {
    case "bad_request:api":
      return "Запит не може бути оброблений. Перевірте введені дані та спробуйте ще раз.";

    case "bad_request:activate_gateway":
      return "AI Gateway вимагає дійсну кредитну картку для обробки запитів. Будь ласка, додайте картку за посиланням https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card, щоб розблокувати ваші безкоштовні кредити.";

    case "unauthorized:auth":
      return "Вам потрібно увійти в систему, щоб продовжити.";
    case "forbidden:auth":
      return "Ваш акаунт не має доступу до цієї функції.";

    case "rate_limit:chat":
      return "Ви перевищили максимальну кількість повідомлень на день. Будь ласка, спробуйте пізніше.";
    case "not_found:chat":
      return "Запитуваний чат не знайдено. Перевірте ID чату і спробуйте ще раз.";
    case "forbidden:chat":
      return "Цей чат належить іншому користувачеві. Перевірте ID чату і спробуйте ще раз.";
    case "unauthorized:chat":
      return "Вам потрібно увійти, щоб переглянути цей чат. Будь ласка, увійдіть і спробуйте ще раз.";
    case "offline:chat":
      return "Сталась проблема з відправкою вашого повідомлення. Перевірте інтернет-з'єднання і спробуйте ще раз.";

    case "not_found:document":
      return "Запитуваний документ не знайдено. Перевірте ID документа і спробуйте ще раз.";
    case "forbidden:document":
      return "Цей документ належить іншому користувачеві. Перевірте ID документа і спробуйте ще раз.";
    case "unauthorized:document":
      return "Вам потрібно увійти, щоб переглянути цей документ. Будь ласка, увійдіть і спробуйте ще раз.";
    case "bad_request:document":
      return "Запит на створення або оновлення документа некоректний. Перевірте введені дані та спробуйте ще раз.";

    default:
      return "Щось пішло не так. Будь ласка, спробуйте ще раз пізніше.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
