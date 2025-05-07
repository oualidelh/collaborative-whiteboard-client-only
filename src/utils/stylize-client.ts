// // File: utils/stylize-client.ts
// // This is a client-safe version to use in your frontend components

// import type { StyleOption } from "@/lib/style-prompts";

// /**
//  * Parameters for stylizing an image
//  */
// export interface StylizeParams {
//   imageData: string; // Base64 encoded image data from canvas
//   style: StyleOption;
//   iterations?: number; // Number of iterations (1-5)
//   strength?: number; // Strength of transformation (0.1-1.0)
//   seed?: number; // Random seed for reproducibility
// }

// /**
//  * Response from the stylize API
//  */
// export interface StylizeResponse {
//   success: boolean;
//   styledImage?: string; // Base64 encoded stylized image
//   error?: string;
// }

// /**
//  * Stylizes an image according to the selected style by calling our API
//  * @param params - Stylization parameters
//  * @returns Promise with the stylized image or error
//  */
// export async function stylizeImage(
//   params: StylizeParams
// ): Promise<StylizeResponse> {
//   try {
//     // Validate parameters
//     if (!params.imageData) {
//       throw new Error("Image data is required");
//     }

//     if (!params.style) {
//       throw new Error("Style is required");
//     }

//     // Call our server-side API
//     const response = await fetch("/api/stylize", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         imageData: params.imageData,
//         style: params.style,
//         iterations: params.iterations || 1,
//         strength: params.strength || 0.7,
//         seed: params.seed,
//       }),
//     });

//     // Parse the response
//     const result = await response.json();

//     if (!response.ok) {
//       return {
//         success: false,
//         error:
//           result.error || `Error: ${response.status} ${response.statusText}`,
//       };
//     }

//     return result;
//   } catch (err) {
//     console.error("Stylize error:", err);
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : "Unknown error occurred",
//     };
//   }
// }

// // You can re-export from style-prompts if needed
// // export { stylePrompts, getStyleDisplayName } from "@/lib/style-prompts";
// // export type { StyleOption };
// // File: utils/stylize-client.ts
// import type { StyleOption } from "@/lib/style-prompts";

// /**
//  * Parameters for stylizing an image
//  */
// export interface StylizeParams {
//   imageData: string; // Base64 encoded image data from canvas
//   style: StyleOption;
//   iterations?: number; // Number of iterations (1-5)
//   strength?: number; // Strength of transformation (0.1-1.0)
//   seed?: number; // Random seed for reproducibility
//   enhanceBackground?: boolean; // Whether to enhance the background specifically
//   fillEmptySpaces?: boolean; // Whether to fill empty spaces with contextual content
// }

// /**
//  * Response from the stylize API
//  */
// export interface StylizeResponse {
//   success: boolean;
//   styledImage?: string; // Base64 encoded stylized image
//   originalPrompt?: string; // The prompt used for generation (for debugging)
//   processingTime?: number; // How long the processing took
//   error?: string;
// }

// /**
//  * Stylizes an image according to the selected style by calling our API
//  * @param params - Stylization parameters
//  * @returns Promise with the stylized image or error
//  */
// export async function stylizeImage(
//   params: StylizeParams
// ): Promise<StylizeResponse> {
//   try {
//     const startTime = performance.now();

//     // Validate parameters
//     if (!params.imageData) {
//       throw new Error("Image data is required");
//     }

//     if (!params.style) {
//       throw new Error("Style is required");
//     }

//     // Default values
//     const enhanceBackground = params.enhanceBackground !== false; // Default to true
//     const fillEmptySpaces = params.fillEmptySpaces !== false; // Default to true

//     // Call our server-side API
//     const response = await fetch("/api/stylize", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         imageData: params.imageData,
//         style: params.style,
//         iterations: Math.min(Math.max(params.iterations || 2, 1), 5), // Ensure between 1-5
//         strength: Math.min(Math.max(params.strength || 0.8, 0.1), 1.0), // Ensure between 0.1-1.0
//         seed: params.seed,
//         enhanceBackground,
//         fillEmptySpaces,
//       }),
//     });

//     // Parse the response
//     const result = await response.json();
//     const endTime = performance.now();

//     if (!response.ok) {
//       return {
//         success: false,
//         error:
//           result.error || `Error: ${response.status} ${response.statusText}`,
//         processingTime: endTime - startTime,
//       };
//     }

//     return {
//       ...result,
//       processingTime: endTime - startTime,
//       success: true,
//     };
//   } catch (err) {
//     console.error("Stylize error:", err);
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : "Unknown error occurred",
//     };
//   }
// }

// /**
//  * Cancels an ongoing stylization process if supported by the API
//  * @returns Promise indicating if cancellation was successful
//  */
// export async function cancelStylization(): Promise<boolean> {
//   try {
//     const response = await fetch("/api/stylize/cancel", {
//       method: "POST",
//     });

//     return response.ok;
//   } catch (error) {
//     console.error("Error cancelling stylization:", error);
//     return false;
//   }
// }

// import type { StyleOption } from "@/lib/style-prompts";

// /**
//  * Parameters for stylizing an image
//  */
// export interface StylizeParams {
//   imageData: string; // Base64 encoded image data from canvas
//   style: StyleOption;
//   iterations?: number; // Number of iterations (1-5)
//   strength?: number; // Strength of transformation (0.1-1.0)
//   seed?: number; // Random seed for reproducibility
//   enhanceBackground?: boolean; // Whether to enhance the background specifically
//   fillEmptySpaces?: boolean; // Whether to fill empty spaces with contextual content
// }

// /**
//  * Response from the stylize API
//  */
// export interface StylizeResponse {
//   success: boolean;
//   styledImage?: string; // Base64 encoded stylized image
//   originalPrompt?: string; // The prompt used for generation (for debugging)
//   processingTime?: number; // How long the processing took
//   error?: string;
// }

// // Keep track of ongoing requests
// let activeStylizeRequest: AbortController | null = null;

// /**
//  * Stylizes an image according to the selected style by calling our API
//  * @param params - Stylization parameters
//  * @returns Promise with the stylized image or error
//  */
// export async function stylizeImage(
//   params: StylizeParams
// ): Promise<StylizeResponse> {
//   try {
//     const startTime = performance.now();

//     // Validate parameters
//     if (!params.imageData) {
//       throw new Error("Image data is required");
//     }

//     if (!params.style) {
//       throw new Error("Style is required");
//     }

//     // Cancel any existing request
//     if (activeStylizeRequest) {
//       activeStylizeRequest.abort();
//     }

//     // Create a new abort controller for this request
//     const abortController = new AbortController();
//     activeStylizeRequest = abortController;

//     // Default values
//     const enhanceBackground = params.enhanceBackground !== false; // Default to true
//     const fillEmptySpaces = params.fillEmptySpaces !== false; // Default to true

//     // Call our server-side API with timeout handling
//     const response = await fetch("/api/stylize", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         imageData: params.imageData,
//         style: params.style,
//         iterations: Math.min(Math.max(params.iterations || 2, 1), 5), // Ensure between 1-5
//         strength: Math.min(Math.max(params.strength || 0.8, 0.1), 1.0), // Ensure between 0.1-1.0
//         seed: params.seed,
//         enhanceBackground,
//         fillEmptySpaces,
//       }),
//       signal: abortController.signal,
//     });

//     // Request is complete
//     activeStylizeRequest = null;

//     // Parse the response
//     const result = await response.json();
//     const endTime = performance.now();

//     if (!response.ok) {
//       return {
//         success: false,
//         error:
//           result.error || `Error: ${response.status} ${response.statusText}`,
//         processingTime: endTime - startTime,
//       };
//     }

//     return {
//       ...result,
//       processingTime: endTime - startTime,
//       success: true,
//     };
//   } catch (err) {
//     // Handle aborted requests gracefully
//     if (err instanceof DOMException && err.name === "AbortError") {
//       console.log("Request was cancelled");
//       return {
//         success: false,
//         error: "Request was cancelled",
//       };
//     }

//     console.error("Stylize error:", err);
//     return {
//       success: false,
//       error: err instanceof Error ? err.message : "Unknown error occurred",
//     };
//   } finally {
//     // Clear the active request reference if it's the current one
//     if (activeStylizeRequest?.signal.aborted) {
//       activeStylizeRequest = null;
//     }
//   }
// }

// /**
//  * Cancels an ongoing stylization process if supported by the API
//  * @returns Promise indicating if cancellation was successful
//  */
// export async function cancelStylization(): Promise<boolean> {
//   try {
//     // First abort any client-side request
//     if (activeStylizeRequest) {
//       activeStylizeRequest.abort();
//       activeStylizeRequest = null;
//     }

//     // Then notify the server
//     const response = await fetch("/api/stylize/cancel", {
//       method: "POST",
//     });

//     return response.ok;
//   } catch (error) {
//     console.error("Error cancelling stylization:", error);
//     return false;
//   }
// }

import type { StyleOption } from "@/lib/style-prompts";

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
  isTimeout?: boolean; // Whether the error was due to a timeout
  message?: string; // Additional message from the server
  parameters?: {
    iterations: number;
    strength: number;
    seed: number;
    iterationsLimited?: boolean; // Whether iterations were limited by server
  };
}

// Keep track of ongoing requests
let activeStylizeRequest: AbortController | null = null;

/**
 * Optimize image before sending to server
 * @param imageData Base64 image data
 * @returns Optimized base64 image data
 */
async function optimizeImageForUpload(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element to load the data
    const img = new Image();
    img.onload = () => {
      // Determine if we need to resize
      let width = img.width;
      let height = img.height;
      const MAX_DIMENSION = 800; // Max width or height

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      } else {
        // If image is already small enough, just return original
        resolve(imageData);
        return;
      }

      // Create a canvas for resizing
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Draw image at new size
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Get optimized image data
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = imageData;
  });
}

/**
 * Stylizes an image according to the selected style by calling our API
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

    // Optimize the image before sending
    let optimizedImageData = params.imageData;
    try {
      // Only optimize if image is large (to avoid unnecessary processing)
      if (params.imageData.length > 100000) {
        // Roughly 100KB
        optimizedImageData = await optimizeImageForUpload(params.imageData);
        console.log("Image optimized for upload");
      }
    } catch (err) {
      console.warn("Image optimization failed, using original:", err);
    }

    // Determine fetch timeout based on iterations
    // Higher iterations need more time
    const timeoutMs = 60000 + (params.iterations || 2) * 15000;

    // Call our server-side API with timeout handling
    const fetchPromise = fetch("/api/stylize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageData: optimizedImageData,
        style: params.style,
        iterations: Math.min(Math.max(params.iterations || 2, 1), 5), // Ensure between 1-5
        strength: Math.min(Math.max(params.strength || 0.8, 0.1), 1.0), // Ensure between 0.1-1.0
        seed: params.seed,
        enhanceBackground,
        fillEmptySpaces,
      }),
      signal: abortController.signal,
    });

    // Set up a timeout
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Request timed out after ${timeoutMs / 1000} seconds`)
        );
      }, timeoutMs);
    });

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    // Request is complete
    activeStylizeRequest = null;

    // Parse the response
    const result = await response.json();
    const endTime = performance.now();

    if (!response.ok) {
      // Special handling for timeout errors from server
      if (response.status === 408 || result.isTimeout) {
        return {
          success: false,
          error:
            result.error ||
            "Processing timed out. Try reducing the detail level or try again later.",
          isTimeout: true,
          processingTime: endTime - startTime,
        };
      }

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

    // Handle timeouts
    if (err instanceof Error && err.message.includes("timed out")) {
      console.error("Request timed out:", err);
      return {
        success: false,
        error:
          "The stylization process took too long. Try using a lower detail level (1-2) or try again later.",
        isTimeout: true,
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

    // Then notify the server
    const response = await fetch("/api/stylize/cancel", {
      method: "POST",
    });

    return response.ok;
  } catch (error) {
    console.error("Error cancelling stylization:", error);
    return false;
  }
}
