export const MODEL_ID = 'llama-3.1-8b-instant';

export const DEFAULT_CHAT_MODEL = `openai/${MODEL_ID}`;

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: `openai/${MODEL_ID}`,
    name: "Мудрий ШІ",
    provider: "openai",
    description: "Надшвидка модель на базі Llama 3.1",
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
