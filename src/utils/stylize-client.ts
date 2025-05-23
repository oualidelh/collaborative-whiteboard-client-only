// File: utils/stylize-client.ts

import type { StyleOption } from "@/lib/style-prompts";

// Get the backend URL, with fallback logic
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://stylize-backend.onrender.com"; // Replace with your actual Render URL

// Remove or comment out this problematic console log in production
// console.log("Backend server URL:", BACKEND_API_URL);

/**
 * Parameters for stylizing an image
 */
export interface StylizeParams {
  imageData: string; // Base64 encoded image data from canvas
  style: StyleOption;
  iterations?: number; // Number of iterations (1-5)
  strength?: number; // Strength of transformation (0.1-1.0)
  seed?: number; // Random seed for reproducibility
  enhanceBackground?: boolean; // Whether to enhance the background specifically
  fillEmptySpaces?: boolean; // Whether to fill empty spaces with contextual content
}

/**
 * Response from the stylize API
 */
export interface StylizeResponse {
  success: boolean;
  styledImage?: string; // Base64 encoded stylized image
  originalPrompt?: string; // The prompt used for generation (for debugging)
  processingTime?: number; // How long the processing took
  error?: string;
}

// Keep track of ongoing requests
let activeStylizeRequest: AbortController | null = null;

/**
 * Stylizes an image according to the selected style by calling our backend API
 * @param params - Stylization parameters
 * @returns Promise with the stylized image or error
 */
export async function stylizeImage(
  params: StylizeParams
): Promise<StylizeResponse> {
  try {
    const startTime = performance.now();

    // Validate parameters
    if (!params.imageData) {
      throw new Error("Image data is required");
    }

    if (!params.style) {
      throw new Error("Style is required");
    }

    // Cancel any existing request
    if (activeStylizeRequest) {
      activeStylizeRequest.abort();
    }

    // Create a new abort controller for this request
    const abortController = new AbortController();
    activeStylizeRequest = abortController;

    // Default values
    const enhanceBackground = params.enhanceBackground !== false; // Default to true
    const fillEmptySpaces = params.fillEmptySpaces !== false; // Default to true

    // Log the URL being used (remove in production)
    // console.log("Making request to:", `${BACKEND_API_URL}/api/stylize`);

    // Call our backend API with timeout handling
    const response = await fetch(`${BACKEND_API_URL}/api/stylize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: params.imageData,
        style: params.style,
        iterations: Math.min(Math.max(params.iterations || 2, 1), 5), // Ensure between 1-5
        strength: Math.min(Math.max(params.strength || 0.8, 0.1), 1.0), // Ensure between 0.1-1.0
        seed: params.seed,
        enhanceBackground,
        fillEmptySpaces,
      }),
      signal: abortController.signal,
    });

    // Request is complete
    activeStylizeRequest = null;

    // Parse the response
    const result = await response.json();
    const endTime = performance.now();

    if (!response.ok) {
      return {
        success: false,
        error:
          result.error || `Error: ${response.status} ${response.statusText}`,
        processingTime: endTime - startTime,
      };
    }

    return {
      ...result,
      processingTime: endTime - startTime,
      success: true,
    };
  } catch (err) {
    // Handle aborted requests gracefully
    if (err instanceof DOMException && err.name === "AbortError") {
      console.log("Request was cancelled");
      return {
        success: false,
        error: "Request was cancelled",
      };
    }

    console.error("Stylize error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  } finally {
    // Clear the active request reference if it's the current one
    if (activeStylizeRequest?.signal.aborted) {
      activeStylizeRequest = null;
    }
  }
}

/**
 * Cancels an ongoing stylization process if supported by the API
 * @returns Promise indicating if cancellation was successful
 */
export async function cancelStylization(): Promise<boolean> {
  try {
    // First abort any client-side request
    if (activeStylizeRequest) {
      activeStylizeRequest.abort();
      activeStylizeRequest = null;
    }

    // Then notify the backend server
    const response = await fetch(`${BACKEND_API_URL}/api/stylize/cancel`, {
      method: "POST",
    });

    return response.ok;
  } catch (error) {
    console.error("Error cancelling stylization:", error);
    return false;
  }
}
