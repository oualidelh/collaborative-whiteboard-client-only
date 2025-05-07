// import { NextResponse, NextRequest } from "next/server";
// import { Client } from "@gradio/client";
// import { stylePrompts } from "@/lib/style-prompts";
// import type { StyleOption } from "@/lib/style-prompts";
// import { analyzeImageContent } from "@/utils/image-analyzer";
// import {
//   createEnhancedPrompt,
//   recommendStrength,
//   recommendIterations,
// } from "@/utils/prompt-enhancer";

// export const config = {
//   runtime: "nodejs",
// };

// // Types for API request
// interface StyleRequest {
//   imageData: string;
//   style: StyleOption;
//   iterations?: number;
//   strength?: number;
//   seed?: number;
//   enhanceBackground?: boolean;
//   fillEmptySpaces?: boolean;
// }

// // Types for image processing
// interface ProcessImageOptions {
//   imageInput: string | Blob;
//   prompt?: string;
//   iterations?: number;
//   seed?: number;
//   strength?: number;
// }

// interface ProcessImageResult {
//   success: boolean;
//   imageDataUrl?: string;
//   imageUrl?: string;
//   error?: string;
// }

// /**
//  * Convert a base64 string to a Blob
//  */
// function base64ToBlob(dataUrl: string): Blob {
//   const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

//   if (!matches || matches.length !== 3) {
//     throw new Error("Invalid base64 image format");
//   }

//   const contentType = matches[1];
//   const base64Data = matches[2];
//   const binaryString = atob(base64Data);
//   const byteArray = new Uint8Array(binaryString.length);

//   for (let i = 0; i < binaryString.length; i++) {
//     byteArray[i] = binaryString.charCodeAt(i);
//   }

//   return new Blob([byteArray], { type: contentType });
// }

// /**
//  * Process an image using the SDXL API (server-side only)
//  */
// async function processImage({
//   imageInput,
//   prompt = "fantasy landscape",
//   iterations = 1,
//   seed = 0,
//   strength = 0.5,
// }: ProcessImageOptions): Promise<ProcessImageResult> {
//   try {
//     console.log("Starting image processing...");

//     let imageBlob: Blob;

//     // Handle different image input types
//     if (typeof imageInput === "string") {
//       if (imageInput.startsWith("data:")) {
//         // Convert base64 string to Blob
//         imageBlob = base64ToBlob(imageInput);
//       } else if (imageInput.startsWith("http")) {
//         // Handle URL input
//         console.log(`Fetching image from URL: ${imageInput}`);
//         const response = await fetch(imageInput);
//         if (!response.ok) {
//           throw new Error(
//             `Failed to fetch image: ${response.status} ${response.statusText}`
//           );
//         }
//         imageBlob = await response.blob();
//       } else {
//         throw new Error("Image input must be a data URL, web URL, or Blob");
//       }
//     } else if (imageInput instanceof Blob) {
//       // Use the blob directly
//       imageBlob = imageInput;
//     } else {
//       throw new Error("Invalid image input type");
//     }

//     // Connect to the API
//     console.log("Connecting to SDXL-Turbo-Img2Img-CPU API...");
//     const app = await Client.connect("sweetpotatoman/SDXL-Turbo-Img2Img-CPU");

//     // Log parameters
//     console.log(`Parameters:
// - Prompt: "${prompt}"
// - Iterations: ${iterations}
// - Seed: ${seed}
// - Strength: ${strength}`);

//     // Make the prediction
//     console.log("Processing image...");

//     // Pass the params to the API
//     const result = await app.predict("/predict", [
//       imageBlob,
//       prompt,
//       parseInt(String(iterations), 10),
//       parseInt(String(seed), 10),
//       parseFloat(String(strength)),
//     ]);

//     console.log("Processing completed. Checking result...");

//     if (result && result.data) {
//       console.log("Result received");

//       // The API returns an object with a URL to the generated image
//       if (Array.isArray(result.data) && result.data[0] && result.data[0].url) {
//         const imageUrl = result.data[0].url;
//         console.log(`Image URL received: ${imageUrl}`);

//         // Download the image from the provided URL
//         const imageResponse = await fetch(imageUrl);
//         if (!imageResponse.ok) {
//           throw new Error(
//             `Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`
//           );
//         }

//         // Get the image data as ArrayBuffer
//         const imageData = await imageResponse.arrayBuffer();

//         // Convert to base64
//         const base64 = Buffer.from(imageData).toString("base64");
//         const mimeType =
//           imageResponse.headers.get("content-type") || "image/png";
//         const dataUrl = `data:${mimeType};base64,${base64}`;

//         return {
//           success: true,
//           imageDataUrl: dataUrl,
//           imageUrl,
//         };
//       }
//       // Handle the case where the API returns a base64 string directly
//       else if (typeof result.data === "string") {
//         // Ensure it has the data:image prefix
//         let dataUrl = result.data;
//         if (!dataUrl.startsWith("data:")) {
//           dataUrl = `data:image/png;base64,${dataUrl}`;
//         }

//         return {
//           success: true,
//           imageDataUrl: dataUrl,
//         };
//       } else {
//         console.log("Unexpected response format:", result.data);
//         throw new Error("Unexpected response format from API");
//       }
//     } else {
//       console.log("Received result:", result);
//       throw new Error("Invalid or empty response from API");
//     }
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Unknown error occurred";
//     console.error("❌ Error details:", error);
//     return {
//       success: false,
//       error: errorMessage,
//     };
//   }
// }

// /**
//  * Gets a random seed value from the API
//  */
// async function getRandomSeed(): Promise<number> {
//   try {
//     console.log("Fetching random seed value...");
//     const app = await Client.connect("sweetpotatoman/SDXL-Turbo-Img2Img-CPU");
//     const result = await app.predict("/get_random_value", []);

//     if (result && result.data !== undefined) {
//       const seed = parseInt(String(result.data), 10);
//       console.log(`Random seed generated: ${seed}`);
//       return seed;
//     } else {
//       console.error("❌ Invalid random seed response:", result);
//       return Math.floor(Math.random() * 1000000); // Fallback
//     }
//   } catch (error) {
//     console.error("❌ Error fetching random seed:", error);
//     return Math.floor(Math.random() * 1000000); // Fallback
//   }
// }

// /**
//  * Main API handler for POST requests
//  */
// export async function POST(request: NextRequest) {
//   try {
//     // Parse and validate request body
//     const body = (await request.json()) as StyleRequest;
//     const {
//       imageData,
//       style,
//       iterations,
//       strength,
//       seed,
//       enhanceBackground = true,
//       fillEmptySpaces = true,
//     } = body;

//     // Validate required fields
//     if (!imageData) {
//       return NextResponse.json(
//         { success: false, error: "Image data is required" },
//         { status: 400 }
//       );
//     }

//     if (!style) {
//       return NextResponse.json(
//         { success: false, error: "Style is required" },
//         { status: 400 }
//       );
//     }

//     // Check if style is valid
//     if (!Object.keys(stylePrompts).includes(style)) {
//       return NextResponse.json(
//         { success: false, error: "Invalid style option" },
//         { status: 400 }
//       );
//     }

//     // NEW: Analyze the image content
//     console.log("Analyzing image content...");
//     const imageAnalysis = await analyzeImageContent(imageData);
//     console.log("Image analysis complete:", JSON.stringify(imageAnalysis));

//     // NEW: Create enhanced prompt based on image analysis
//     const prompt = createEnhancedPrompt(style, imageAnalysis, {
//       enhanceBackground,
//       fillEmptySpaces,
//       addAtmosphericElements: true,
//       preserveStyle: true,
//     });
//     console.log("Enhanced prompt created:", prompt);

//     // NEW: Use recommended parameters if not provided
//     const safeIterations =
//       iterations !== undefined
//         ? Math.min(Math.max(iterations, 1), 5)
//         : recommendIterations(imageAnalysis);

//     const safeStrength =
//       strength !== undefined
//         ? Math.min(Math.max(strength, 0.1), 1.0)
//         : recommendStrength(imageAnalysis);

//     console.log(
//       `Using parameters: iterations=${safeIterations}, strength=${safeStrength}`
//     );

//     // Use a random seed if not provided
//     const finalSeed = seed || (await getRandomSeed());

//     // Process the image
//     console.log(`Processing image with style: ${style}`);
//     const result = await processImage({
//       imageInput: imageData,
//       prompt,
//       iterations: safeIterations,
//       seed: parseInt(String(finalSeed)),
//       strength: safeStrength,
//     });

//     if (!result.success) {
//       return NextResponse.json(
//         { success: false, error: result.error || "Failed to stylize image" },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       styledImage: result.imageDataUrl,
//       originalPrompt: prompt, // Returning the prompt for debugging/learning
//       parameters: {
//         iterations: safeIterations,
//         strength: safeStrength,
//         seed: finalSeed,
//       },
//       analysis: imageAnalysis, // Return the analysis for client-side learning
//     });
//   } catch (error) {
//     console.error("Error processing style request:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Unknown error occurred",
//       },
//       { status: 500 }
//     );
//   }
// }

/**
 * Cancel API handler for POST requests
 */
// export async function cancel() {
//   return NextResponse.json({
//     success: true,
//     message: "Stylization canceled",
//   });
// }

import { NextResponse, NextRequest } from "next/server";
import { Client } from "@gradio/client";
import { stylePrompts } from "@/lib/style-prompts";
import type { StyleOption } from "@/lib/style-prompts";
import { analyzeImageContent } from "@/utils/image-analyzer";
import {
  createEnhancedPrompt,
  recommendStrength,
  recommendIterations,
} from "@/utils/prompt-enhancer";

export const config = {
  runtime: "edge", // Use edge runtime for better performance
  maxDuration: 60, // Set maximum duration to 60 seconds (if your plan supports it)
};

// Types for API request
interface StyleRequest {
  imageData: string;
  style: StyleOption;
  iterations?: number;
  strength?: number;
  seed?: number;
  enhanceBackground?: boolean;
  fillEmptySpaces?: boolean;
}

// Types for image processing
interface ProcessImageOptions {
  imageInput: string | Blob;
  prompt?: string;
  iterations?: number;
  seed?: number;
  strength?: number;
}

interface ProcessImageResult {
  success: boolean;
  imageDataUrl?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Convert a base64 string to a Blob
 */
function base64ToBlob(dataUrl: string): Blob {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 image format");
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const binaryString = atob(base64Data);
  const byteArray = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return new Blob([byteArray], { type: contentType });
}

/**
 * Process an image using the SDXL API (server-side only)
 */
async function processImage({
  imageInput,
  prompt = "fantasy landscape",
  iterations = 1,
  seed = 0,
  strength = 0.5,
}: ProcessImageOptions): Promise<ProcessImageResult> {
  try {
    console.log("Starting image processing...");

    let imageBlob: Blob;

    // Handle different image input types
    if (typeof imageInput === "string") {
      if (imageInput.startsWith("data:")) {
        // Convert base64 string to Blob
        imageBlob = base64ToBlob(imageInput);
      } else if (imageInput.startsWith("http")) {
        // Handle URL input
        console.log(`Fetching image from URL: ${imageInput}`);
        const response = await fetch(imageInput);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch image: ${response.status} ${response.statusText}`
          );
        }
        imageBlob = await response.blob();
      } else {
        throw new Error("Image input must be a data URL, web URL, or Blob");
      }
    } else if (imageInput instanceof Blob) {
      // Use the blob directly
      imageBlob = imageInput;
    } else {
      throw new Error("Invalid image input type");
    }

    // Optimize image size if too large
    if (imageBlob.size > 1024 * 1024) {
      // If larger than 1MB
      console.log("Optimizing image size for faster processing...");
      const img = new Image();
      const canvas = new OffscreenCanvas(800, 800); // Limit size to 800x800
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Create a temporary URL for the image
      const url = URL.createObjectURL(imageBlob);

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      if (width > height && width > 800) {
        height = Math.round((height * 800) / width);
        width = 800;
      } else if (height > 800) {
        width = Math.round((width * 800) / height);
        height = 800;
      }

      // Resize image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert back to blob
      imageBlob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.85,
      });

      // Cleanup
      URL.revokeObjectURL(url);
      console.log(`Image optimized: ${(imageBlob.size / 1024).toFixed(2)}KB`);
    }

    // Connect to the API with a timeout
    console.log("Connecting to SDXL-Turbo-Img2Img-CPU API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

    const token = process.env.HF_TOKEN as `hf_${string}` | undefined;

    const app = await Client.connect("sweetpotatoman/SDXL-Turbo-Img2Img-CPU", {
      hf_token: token, // Add Hugging Face token if available
    });

    // Log parameters
    console.log(`Parameters:
- Prompt: "${prompt}"
- Iterations: ${iterations}
- Seed: ${seed}
- Strength: ${strength}`);

    // Limit iterations on serverless environment
    const safeIterations = Math.min(iterations, 3); // Cap iterations to 3 on Vercel
    if (safeIterations < iterations) {
      console.log(
        `Reducing iterations from ${iterations} to ${safeIterations} for Vercel compatibility`
      );
    }

    // Make the prediction with timeout handling
    console.log("Processing image...");

    try {
      // Pass the params to the API
      const result = await Promise.race([
        app.predict("/predict", [
          imageBlob,
          prompt,
          parseInt(String(safeIterations), 10),
          parseInt(String(seed), 10),
          parseFloat(String(strength)),
        ]),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error("API request timed out after 50 seconds")),
            50000
          );
        }),
      ]);

      clearTimeout(timeoutId);

      console.log("Processing completed. Checking result...");

      if (result && result.data) {
        console.log("Result received");

        // The API returns an object with a URL to the generated image
        if (
          Array.isArray(result.data) &&
          result.data[0] &&
          result.data[0].url
        ) {
          const imageUrl = result.data[0].url;
          console.log(`Image URL received: ${imageUrl}`);

          // Download the image from the provided URL
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(
              `Failed to download generated image: ${imageResponse.status} ${imageResponse.statusText}`
            );
          }

          // Get the image data as ArrayBuffer
          const imageData = await imageResponse.arrayBuffer();

          // Convert to base64
          const base64 = Buffer.from(imageData).toString("base64");
          const mimeType =
            imageResponse.headers.get("content-type") || "image/png";
          const dataUrl = `data:${mimeType};base64,${base64}`;

          return {
            success: true,
            imageDataUrl: dataUrl,
            imageUrl,
          };
        }
        // Handle the case where the API returns a base64 string directly
        else if (typeof result.data === "string") {
          // Ensure it has the data:image prefix
          let dataUrl = result.data;
          if (!dataUrl.startsWith("data:")) {
            dataUrl = `data:image/png;base64,${dataUrl}`;
          }

          return {
            success: true,
            imageDataUrl: dataUrl,
          };
        } else {
          console.log("Unexpected response format:", result.data);
          throw new Error("Unexpected response format from API");
        }
      } else {
        console.log("Received result:", result);
        throw new Error("Invalid or empty response from API");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error details:", error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Gets a random seed value from the API
 */
async function getRandomSeed(): Promise<number> {
  try {
    console.log("Fetching random seed value...");
    const app = await Client.connect("sweetpotatoman/SDXL-Turbo-Img2Img-CPU");
    const result = await app.predict("/get_random_value", []);

    if (result && result.data !== undefined) {
      const seed = parseInt(String(result.data), 10);
      console.log(`Random seed generated: ${seed}`);
      return seed;
    } else {
      console.error("❌ Invalid random seed response:", result);
      return Math.floor(Math.random() * 1000000); // Fallback
    }
  } catch (error) {
    console.error("❌ Error fetching random seed:", error);
    return Math.floor(Math.random() * 1000000); // Fallback
  }
}

/**
 * Main API handler for POST requests
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = (await request.json()) as StyleRequest;
    const {
      imageData,
      style,
      iterations,
      strength,
      seed,
      enhanceBackground = true,
      fillEmptySpaces = true,
    } = body;

    // Validate required fields
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    if (!style) {
      return NextResponse.json(
        { success: false, error: "Style is required" },
        { status: 400 }
      );
    }

    // Check if style is valid
    if (!Object.keys(stylePrompts).includes(style)) {
      return NextResponse.json(
        { success: false, error: "Invalid style option" },
        { status: 400 }
      );
    }

    // NEW: Analyze the image content with reduced analysis for speed
    console.log("Analyzing image content...");
    const imageAnalysis = await analyzeImageContent(imageData, {
      samplingDensity: 25, // Reduce sampling density for faster analysis
    });
    console.log("Image analysis complete:", JSON.stringify(imageAnalysis));

    // NEW: Create enhanced prompt based on image analysis
    const prompt = createEnhancedPrompt(style, imageAnalysis, {
      enhanceBackground,
      fillEmptySpaces,
      addAtmosphericElements: true,
      preserveStyle: true,
    });
    console.log("Enhanced prompt created:", prompt);

    // NEW: Use recommended parameters if not provided
    // For Vercel, we'll cap iterations to ensure we don't exceed the function timeout
    const maxServerlessIterations = 3; // Maximum safe iterations on Vercel

    const recommendedIterations = recommendIterations(imageAnalysis);
    const safeIterations =
      iterations !== undefined
        ? Math.min(Math.max(iterations, 1), maxServerlessIterations)
        : Math.min(recommendedIterations, maxServerlessIterations);

    // If user requested more iterations than we can safely do, add a note in the response
    const limitedIterations =
      iterations && iterations > maxServerlessIterations;

    const safeStrength =
      strength !== undefined
        ? Math.min(Math.max(strength, 0.1), 1.0)
        : recommendStrength(imageAnalysis);

    console.log(
      `Using parameters: iterations=${safeIterations}, strength=${safeStrength}`
    );

    // Use a random seed if not provided
    const finalSeed = seed || (await getRandomSeed());

    // Process the image
    console.log(`Processing image with style: ${style}`);
    const result = await processImage({
      imageInput: imageData,
      prompt,
      iterations: safeIterations,
      seed: parseInt(String(finalSeed)),
      strength: safeStrength,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to stylize image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      styledImage: result.imageDataUrl,
      originalPrompt: prompt, // Returning the prompt for debugging/learning
      parameters: {
        iterations: safeIterations,
        strength: safeStrength,
        seed: finalSeed,
        iterationsLimited: limitedIterations,
      },
      analysis: imageAnalysis, // Return the analysis for client-side learning
      message: limitedIterations
        ? "Iterations were limited for serverless compatibility"
        : undefined,
    });
  } catch (error) {
    console.error("Error processing style request:", error);

    // Special handling for timeout errors
    if (
      error instanceof Error &&
      (error.message.includes("timeout") || error.message.includes("aborted"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Processing timed out. Try reducing the detail level or upgrading your Vercel plan for longer functions.",
          isTimeout: true,
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
