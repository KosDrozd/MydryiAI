import { tool } from "ai";
import { z } from "zod";

async function geocodeCity(
  city: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return null;
  }
}

export const getWeather = tool({
  description:
    "Отримати поточну погоду в місці. Ви можете вказати координати або назву міста.",
  inputSchema: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z
      .string()
      .describe("Назва міста (наприклад, 'Київ', 'Львів', 'Одеса')")
      .optional(),
  }),
  needsApproval: false,
  execute: async (input) => {
    let latitude: number;
    let longitude: number;

    if (input.city) {
      const coords = await geocodeCity(input.city);
      if (!coords) {
        return {
          error: `Не вдалося знайти координати для "${input.city}". Перевірте назву міста.`,
        };
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else if (input.latitude !== undefined && input.longitude !== undefined) {
      latitude = input.latitude;
      longitude = input.longitude;
    } else {
      return {
        error:
          "Будь ласка, вкажіть або назву міста, або обидві координати (широта та довгота).",
      };
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
    );

    const weatherData = await response.json();

    if ("city" in input) {
      weatherData.cityName = input.city;
    }

    return weatherData;
  },
});
