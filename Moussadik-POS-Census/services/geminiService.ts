
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const verifyPOSWithAI = async (name: string, address: string, lat?: number, lng?: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Vérifie si le point de vente suivant existe réellement au Maroc: "${name}" situé à "${address}". Si tu as des coordonnées (${lat}, ${lng}), utilise-les. Réponds en précisant s'il est probable qu'il soit toujours ouvert et donne des détails si possible (horaires, avis).`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
          }
        }
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Impossible de vérifier via l'IA pour le moment.", grounding: [] };
  }
};
