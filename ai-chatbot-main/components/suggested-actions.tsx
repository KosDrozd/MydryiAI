"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "./elements/suggestion";
import type { VisibilityType } from "./visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = [
    "Останні новини в Україні",
    "Розкажи про маловідомі факти з історії України",
    "Порадь цікавий український фільм або серіал на вечір",
  ];

  return (
    <div
      className="grid w-full gap-1 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 10, y: 10 }}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: 10 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
