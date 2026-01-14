import { Output, streamText, tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { getDocumentById, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { getArtifactModel } from "../providers";

type RequestSuggestionsProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description:
      "Запитувати пропозиції щодо покращення написаного документа. Використовувати лише коли користувач явно просить покращити документ. Не застосовувати для загальних питань.",
    inputSchema: z.object({
      documentId: z
        .string()
        .describe(
          "UUID існуючого документа, що був раніше створений через createDocument"
        ),
    }),
    execute: async ({ documentId }) => {
      const document = await getDocumentById({ id: documentId });

      if (!document || !document.content) {
        return {
          error: "Документ не знайдено",
        };
      }

      const suggestions: Omit<
        Suggestion,
        "userId" | "createdAt" | "documentCreatedAt"
      >[] = [];

      const { partialOutputStream } = streamText({
        model: getArtifactModel(),
        system:
          "Ви — помічник з редагування тексту. Отримавши фрагмент письма, запропонуйте покращення та опишіть зміни. Важливо, щоб виправлення були повними реченнями, а не окремими словами. Максимум 5 пропозицій.",
        prompt: document.content,
        output: Output.array({
          element: z.object({
            originalSentence: z.string().describe("Оригінальне речення"),
            suggestedSentence: z.string().describe("Запропоноване речення"),
            description: z
              .string()
              .describe("Опис пропозиції"),
          }),
        }),
      });

      let processedCount = 0;
      for await (const partialOutput of partialOutputStream) {
        if (!partialOutput) {
          continue;
        }

        for (let i = processedCount; i < partialOutput.length; i++) {
          const element = partialOutput[i];
          if (
            !element?.originalSentence ||
            !element?.suggestedSentence ||
            !element?.description
          ) {
            continue;
          }

          const suggestion = {
            originalText: element.originalSentence,
            suggestedText: element.suggestedSentence,
            description: element.description,
            id: generateUUID(),
            documentId,
            isResolved: false,
          };

          dataStream.write({
            type: "data-suggestion",
            data: suggestion as Suggestion,
            transient: true,
          });

          suggestions.push(suggestion);
          processedCount++;
        }
      }
      if (session.user?.id) {
        const userId = session.user.id;

        await saveSuggestions({
          suggestions: suggestions.map((suggestion) => ({
            ...suggestion,
            userId,
            createdAt: new Date(),
            documentCreatedAt: document.createdAt,
          })),
        });
      }

      return {
        id: documentId,
        title: document.title,
        kind: document.kind,
        message: "Пропозиції додано до документа",
      };
    },
  });
