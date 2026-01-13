import { createGroq } from "@ai-sdk/groq";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Ініціалізація провайдера для Groq
const groqProvider = createGroq({
  apiKey: process.env.OPENAI_API_KEY,
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  // ВАЖЛИВО: Перевіряємо, чи modelId не порожній
  let model = modelId;
  
  if (!modelId || modelId.trim() === '') {
    model = process.env.NEXT_PUBLIC_MODEL || 'llama-3.1-8b-instant';
  }

  // ВАЖЛИВО: Видаляємо "openai/", щоб Groq зрозумів назву моделі
  const modelName = model.includes('/') ? model.split('/')[1] : model;

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const providerModelId = modelName.replace(/-thinking$/, "");
    return groqProvider.languageModel(providerModelId);
  }

  return groqProvider.languageModel(modelName);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  // Тут використовуємо чисту назву моделі з .env
  const modelName = process.env.NEXT_PUBLIC_MODEL || "llama-3.1-8b-instant";
  return groqProvider.languageModel(modelName);
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  const modelName = process.env.NEXT_PUBLIC_MODEL || "llama-3.1-8b-instant";
  return groqProvider.languageModel(modelName);
}