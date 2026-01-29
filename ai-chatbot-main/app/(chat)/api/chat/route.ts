import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
} from "ai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  getUserById,        // <-- Нова функція для отримання лімітів
  getUser,
  createUserIfNotExists,
  updateUserUsage,    // <-- Нова функція для оновлення лічильника
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { generatePaymentUrl } from "@/lib/payment"; // <-- Функція оплати WayForPay
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;
  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }
  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    // 1. АВТОРИЗАЦІЯ
    const session = await auth();
    console.log(`[AUTH] session user id: ${session?.user?.id}, type: ${session?.user?.type}`);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    // 2. ОТРИМАННЯ ДАНИХ ЮЗЕРА (Перевірка лімітів та Premium)
    let currentUser = await getUserById(session.user.id);
    if (!currentUser && session.user.email) {
      console.log(`User not found by id (${session.user.id}), trying lookup by email: ${session.user.email}`);
      const usersByEmail = await getUser(session.user.email);
      if (usersByEmail && usersByEmail.length > 0) {
        currentUser = usersByEmail[0];
        console.log(`Found user by email: ${currentUser.id}`);
      }
    }

    if (!currentUser) {
      // If we still don't have a DB user, create one from the session email (social logins)
      const sessionEmail = session.user.email;
      if (sessionEmail) {
        console.log(`Creating new user row for email: ${sessionEmail}`);
        currentUser = await createUserIfNotExists(sessionEmail);
      }
    }

    if (!currentUser) {
      return new Response("User not found", { status: 404 });
    }
    console.log(`[USER] ID: ${currentUser.id}, Email: ${currentUser.email}, Premium: ${currentUser.isPremium}, Count: ${currentUser.dailyMessageCount}, LastDate: ${currentUser.lastMessageDate}`);

    // Перевіряємо ліміти тільки для нових повідомлень від юзера
    if (message?.role === "user") {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Встановлюємо на початок дня
      
      const lastDate = currentUser.lastMessageDate ? new Date(currentUser.lastMessageDate) : null;
      let lastDateStart = null;
      if (lastDate) {
        lastDateStart = new Date(lastDate);
        lastDateStart.setHours(0, 0, 0, 0); // Встановлюємо на початок дня
      }
      
      // Перевіряємо, чи це той самий день
      const isSameDay = lastDateStart && lastDateStart.getTime() === today.getTime();

      // Скидаємо лічильник, якщо настав новий день
      let currentCount = isSameDay ? (currentUser.dailyMessageCount || 0) : 0;
      
      // Якщо день змінився - скидаємо в БД відразу
      if (!isSameDay && currentUser.dailyMessageCount && currentUser.dailyMessageCount > 0) {
        console.log(`[LIMITS] New day detected for ${currentUser.id}, resetting counter from ${currentUser.dailyMessageCount} to 0`);
        await updateUserUsage(currentUser.id, 0);
      }

      // Визначаємо ліміт (20 для Premium, 3 для Free)
      const LIMIT = currentUser.isPremium ? 20 : 3;

      console.log(`[LIMITS] User: ${currentUser.id}, Current: ${currentCount}, Limit: ${LIMIT}, Premium: ${currentUser.isPremium}, LastDate: ${lastDate}, IsSameDay: ${isSameDay}`);

      if (currentCount >= LIMIT) {
        console.log(`[LIMITS] Limit reached for ${currentUser.id}. Preparing premium message.`);
        // Генеруємо посилання на оплату
        const paymentLink = generatePaymentUrl(currentUser.id, currentUser.email);
        
        const errorMessage = currentUser.isPremium 
          ? "Ви вичерпали ліміт 20 повідомлень на сьогодні. Спробуйте завтра!" 
          : `Ліміт (3 повідомлення) вичерпано.\n\nЩоб отримати більше, підтримайте проект (40 грн/міс):\n${paymentLink}`;

        console.log(`[LIMITS] Premium message payload: ${errorMessage}`);

        return new Response(errorMessage, { status: 429 });
      }

      // Оновлюємо лічильник (+1)
      console.log(`[LIMITS] Updating usage for ${currentUser.id}: ${currentCount} -> ${currentCount + 1}`);
      await updateUserUsage(currentUser.id, currentCount + 1);
    }

    // --- ДАЛІ ЙДЕ СТАНДАРТНА ЛОГІКА ЧАТУ ---

    // Check if this is a tool approval flow (all messages sent)
    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== currentUser.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
        // Limit context to last 10 messages for better performance/cost
        messagesFromDb = messagesFromDb.slice(-10); 
      }
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: currentUser.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);
    const requestHints: RequestHints = { longitude, latitude, city, country };

    // Зберігаємо повідомлення юзера в БД
    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    let streamResult: any = null;

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        if (titlePromise) {
          titlePromise.then((title) => {
            updateChatTitleById({ chatId: id, title });
            dataStream.write({ type: "data-chat-title", data: title });
          });
        }

        const isReasoningModel =
          selectedChatModel.includes("reasoning") ||
          selectedChatModel.includes("thinking");

        const modelMessages = await convertToModelMessages(uiMessages);

        const result = streamText({
          model: getLanguageModel(selectedChatModel) as any,
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
              ],
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        streamResult = result;
        result.consumeStream();
        
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      try {
        const resumableStream = await streamContext.resumableStream(
          streamId,
          () => stream.pipeThrough(new JsonToSseTransformStream())
        );
        if (resumableStream) {
          return new Response(resumableStream);
        }
      } catch (error) {
        console.error("Failed to create resumable stream:", error);
      }
    }

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error);
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}