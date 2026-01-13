import { createOpenAI } from "@ai-sdk/openai";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

// Ініціалізація провайдера для Groq
const groqProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
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

  // ВАЖЛИВО: Видаляємо "openai/", щоб Groq зрозумів назву моделі
  const modelName = modelId.split('/')[1] || modelId;

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
  return groqProvider.languageModel(process.env.OPENAI_MODEL || "llama3-8b-8192");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return groqProvider.languageModel(process.env.OPENAI_MODEL || "llama3-8b-8192");
}