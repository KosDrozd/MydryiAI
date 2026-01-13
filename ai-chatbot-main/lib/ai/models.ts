// Use OPENAI_MODEL environment variable from .env.local
export const DEFAULT_CHAT_MODEL = `openai/${process.env.OPENAI_MODEL}`;

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: `openai/${process.env.OPENAI_MODEL}`,
    name: "Мудрий ШІ",
    provider: "openai",
    description: "Надшвидка модель на базі Llama 3",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
