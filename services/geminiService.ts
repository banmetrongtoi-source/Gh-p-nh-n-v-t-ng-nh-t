import { GoogleGenAI, Modality, Part } from "@google/genai";
import type { ImageFile } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

const fileToGenerativePart = (file: File): Promise<Part> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({
        inlineData: { data, mimeType },
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateCharacterImages = async (
  prompt: string,
  images: ImageFile[],
  resolution: '2k' | '4k',
  aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<string[]> => {
  const fullPrompt = `${prompt}, masterpiece, best quality, ultra high detail, ${resolution} resolution, ${aspectRatio} aspect ratio`;
  
  const imageParts = await Promise.all(
    images.map(imageFile => fileToGenerativePart(imageFile.file))
  );

  const parts: Part[] = [...imageParts, { text: fullPrompt }];

  const generateSingleImage = async (): Promise<string | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: parts },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating single image:", error);
      throw new Error("Failed to generate an image from the API.");
    }
  };

  // Run 4 API calls in parallel to get 4 images
  const generationPromises = Array(4).fill(null).map(() => generateSingleImage());
  const results = await Promise.all(generationPromises);
  
  // Filter out any null results from failed individual generations
  return results.filter((result): result is string => result !== null);
};
