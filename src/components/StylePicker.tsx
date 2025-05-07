// import { useState, useRef, useEffect } from "react";
// import { stylizeImage, cancelStylization } from "@/utils/stylize-client";
// import { StyleOption, getStyleDisplayName } from "@/lib/style-prompts";
// import { WandSparkles, X, InfoIcon, Loader2 } from "lucide-react";
// import { Slider } from "./ui/slider";
// import { toast } from "sonner";
// import { Button } from "./ui/button";
// import { Tooltip } from "./ui/tooltip";
// import { Switch } from "./ui/switch";

// import { GetSocket } from "@/utils/socket";

// interface StylePickerDropdownProps {
//   canvasRef: React.RefObject<HTMLCanvasElement | null>;
//   onStyleApplied?: (styledImageData: string, styleType: string) => void;
//   onLoading?: (isLoading: boolean) => void;
// }

// export function StylePicker({
//   canvasRef,
//   onStyleApplied,
//   onLoading,
// }: StylePickerDropdownProps) {
//   const [isOpen, setIsOpen] = useState<boolean>(false);
//   const [selectedStyle, setSelectedStyle] = useState<StyleOption>("ghibli");
//   const [strength, setStrength] = useState<number>(0.8); // Increased default to 0.8
//   const [iterations, setIterations] = useState<number>(2); // Default to 2 iterations
//   const [isProcessing, setIsProcessing] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [enhanceBackground, setEnhanceBackground] = useState<boolean>(true);
//   const [fillEmptySpaces, setFillEmptySpaces] = useState<boolean>(true);
//   const [, setProcessingTime] = useState<number>(0);
//   const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
//   const [socketConnected, setSocketConnected] = useState<boolean>(true);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const countdownRef = useRef<NodeJS.Timeout | null>(null);
//   const toastIdRef = useRef<string | number | undefined>(undefined);

//   // Available styles - reordered by popularity
//   const styles: StyleOption[] = [
//     "ghibli",
//     "anime",
//     "realistic",
//     "pixar",
//     "vangogh",
//     "oil",
//     "comic-books",
//     "cyberpunk",
//     "shaun-the-sheep",
//     "child-drawing-3d",
//   ];

//   // Monitor socket connection status
//   useEffect(() => {
//     const socket = GetSocket();

//     // Initial check
//     setSocketConnected(socket.connected);

//     const handleConnect = () => setSocketConnected(true);
//     const handleDisconnect = () => setSocketConnected(false);

//     socket.on("connect", handleConnect);
//     socket.on("disconnect", handleDisconnect);

//     return () => {
//       socket.off("connect", handleConnect);
//       socket.off("disconnect", handleDisconnect);
//     };
//   }, []);

//   // Clean up on unmount
//   useEffect(() => {
//     return () => {
//       if (countdownRef.current) {
//         clearInterval(countdownRef.current);
//       }
//       if (toastIdRef.current) {
//         toast.dismiss(toastIdRef.current);
//       }
//     };
//   }, []);

//   // Close dropdown when clicking outside
//   const handleClickOutside = (event: MouseEvent) => {
//     if (
//       dropdownRef.current &&
//       !dropdownRef.current.contains(event.target as Node)
//     ) {
//       // Check if click is within ShadCN Select portal
//       const shadcnSelect = document.querySelector(
//         "[data-radix-popper-content-wrapper]"
//       );
//       if (shadcnSelect && shadcnSelect.contains(event.target as Node)) {
//         return; // Don't close dropdown if click was inside Select
//       }

//       toast.dismiss();
//       setIsOpen(false);
//     }
//   };

//   // Set up click outside handler
//   useEffect(() => {
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const toggleDropdown = () => {
//     if (isOpen) {
//       // If it's already open, closing it
//       setIsOpen(false);
//       toast.dismiss(); // Close any active toasts
//     } else {
//       // If it's closed, opening it
//       setIsOpen(true);
//       toast.info(
//         "Adding more details to your drawing improves AI style results!",
//         { duration: Infinity }
//       );
//     }
//   };

//   const handleCancel = async () => {
//     if (countdownRef.current) {
//       clearInterval(countdownRef.current);
//       countdownRef.current = null;
//     }

//     if (toastIdRef.current) {
//       toast.dismiss(toastIdRef.current);
//     }

//     await cancelStylization();
//     setIsProcessing(false);
//     if (onLoading) onLoading(false);
//     toast.info("Style transformation cancelled");
//   };

//   const applyStyle = async () => {
//     if (!canvasRef.current) {
//       setError("Canvas is not available");
//       return;
//     }

//     toast.dismiss();
//     // Check socket connection before proceeding
//     if (!socketConnected) {
//       toast.error("Not connected to server. Please wait for reconnection.");
//       return;
//     }

//     let seconds = 60;

//     try {
//       setError(null);
//       setIsProcessing(true);
//       if (onLoading) onLoading(true);

//       toastIdRef.current = toast.info(
//         `This process may take over a minute. Thank you for your patience! (${seconds}s)`,
//         {
//           duration: Infinity,
//         }
//       );

//       countdownRef.current = setInterval(() => {
//         seconds--;
//         if (seconds > 0) {
//           toast.message(
//             `This process may take over a minute. Thank you for your patience! (${seconds}s)`,
//             {
//               id: toastIdRef.current,
//               duration: Infinity,
//             }
//           );
//         } else {
//           if (countdownRef.current) clearInterval(countdownRef.current);
//           toast.message(`Still processing, almost there!`, {
//             id: toastIdRef.current,
//             duration: Infinity,
//           });
//         }
//       }, 1000);

//       const imageData = canvasRef.current.toDataURL("image/png");

//       const result = await stylizeImage({
//         imageData,
//         style: selectedStyle,
//         iterations,
//         strength,
//         enhanceBackground,
//         fillEmptySpaces,
//       });

//       if (countdownRef.current) {
//         clearInterval(countdownRef.current);
//         countdownRef.current = null;
//       }

//       if (toastIdRef.current) {
//         toast.dismiss(toastIdRef.current);
//       }

//       if (!result.success) {
//         setError(result.error || "Failed to stylize image");
//         toast.error(result.error || "Failed to stylize image");
//         setIsProcessing(false);
//         if (onLoading) onLoading(false);
//         return;
//       }

//       if (result.styledImage) {
//         setProcessingTime(result.processingTime || 0);
//         if (onLoading) onLoading(false);
//         setIsProcessing(false);

//         // Use a slight delay to ensure UI is updated properly
//         setTimeout(() => {
//           if (onStyleApplied && result.styledImage) {
//             onStyleApplied(result.styledImage, selectedStyle);
//           }
//         }, 100);

//         toast.success(
//           `Image styled as ${getStyleDisplayName(selectedStyle)} in ${(
//             (result.processingTime || 0) / 1000
//           ).toFixed(1)}s`
//         );
//       }
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "Unknown error");
//       toast.error(error instanceof Error ? error.message : "Unknown error");
//     } finally {
//       setIsProcessing(false);
//       if (onLoading) onLoading(false);
//     }
//   };

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <Tooltip content="Add AI style to your drawing">
//         <Button
//           variant="outline"
//           size="icon"
//           className={`"
//             relative transition-transform hover-lift duration-300 w-9 h-9 flex items-center justify-center rounded-md border font-medium border-gray-200 shadow-sm
// bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white
// bg-[length:200%_200%]
// animate-moveGradient"
//           } ${!socketConnected ? "opacity-50" : ""}`}
//           onClick={toggleDropdown}
//           disabled={isProcessing || !socketConnected}
//         >
//           {isProcessing ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <WandSparkles className="h-4 w-4" />
//           )}
//         </Button>
//       </Tooltip>

//       {isOpen && (
//         <div className="absolute left-0 md:left-auto md:right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 shadow-lg">
//           <div className="mb-4 flex items-center justify-between">
//             <h3 className="text-sm font-semibold">Apply AI Style</h3>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="h-6 w-6"
//               onClick={() => setIsOpen(false)}
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>

//           {!socketConnected && (
//             <div className="mb-4 rounded-md bg-yellow-50 p-2 text-xs text-yellow-600">
//               Server connection lost. Please wait for reconnection.
//             </div>
//           )}

//           <div className="mb-4 grid gap-2">
//             <div className="text-xs text-muted-foreground">Style</div>
//             <select
//               className="w-full rounded-md cursor-pointer border border-primary focus:outline-sage-600 transition-shadow bg-background px-3 py-1 text-sm"
//               value={selectedStyle}
//               onChange={(e) => setSelectedStyle(e.target.value as StyleOption)}
//               disabled={isProcessing || !socketConnected}
//             >
//               {styles.map((style) => (
//                 <option
//                   className="rounded-md border-none"
//                   key={style}
//                   value={style}
//                 >
//                   {getStyleDisplayName(style)}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="mb-4">
//             <div className="mb-2 flex items-center justify-between">
//               <span className="text-xs text-muted-foreground">Strength</span>
//               <span className="text-xs text-muted-foreground">
//                 {Math.round(strength * 100)}%
//               </span>
//             </div>
//             <Slider
//               value={[strength * 100]}
//               min={10}
//               max={100}
//               step={5}
//               onValueChange={(values) => setStrength(values[0] / 100)}
//               disabled={isProcessing || !socketConnected}
//             />
//           </div>

//           <div className="mb-4">
//             <div className="mb-2 flex items-center justify-between">
//               <span className="text-xs text-muted-foreground">
//                 Detail Level
//               </span>
//               <span className="text-xs text-muted-foreground">
//                 {iterations}
//               </span>
//             </div>
//             <Slider
//               value={[iterations]}
//               min={1}
//               max={5}
//               step={1}
//               onValueChange={(values) => setIterations(values[0])}
//               disabled={isProcessing || !socketConnected}
//             />
//           </div>

//           <div className="mb-4">
//             <button
//               className="text-xs text-sage-600 underline"
//               onClick={() => setShowAdvanced(!showAdvanced)}
//               disabled={isProcessing || !socketConnected}
//             >
//               {showAdvanced ? "Hide" : "Show"} advanced options
//             </button>
//           </div>

//           {showAdvanced && (
//             <div className="mb-4 space-y-3">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <span className="text-xs">Enhance Background</span>
//                   <Tooltip content="Add contextual background details to empty areas">
//                     <InfoIcon className="h-3 w-3 text-muted-foreground" />
//                   </Tooltip>
//                 </div>
//                 <Switch
//                   checked={enhanceBackground}
//                   onCheckedChange={setEnhanceBackground}
//                   disabled={isProcessing || !socketConnected}
//                 />
//               </div>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <span className="text-xs">Fill Empty Spaces</span>
//                   <Tooltip content="Automatically add appropriate elements to blank areas">
//                     <InfoIcon className="h-3 w-3 text-muted-foreground" />
//                   </Tooltip>
//                 </div>
//                 <Switch
//                   checked={fillEmptySpaces}
//                   onCheckedChange={setFillEmptySpaces}
//                   disabled={isProcessing || !socketConnected}
//                 />
//               </div>
//             </div>
//           )}

//           {error && (
//             <div className="mb-4 rounded-md bg-red-50 p-2 text-xs text-red-500">
//               {error}
//             </div>
//           )}

//           <div className="flex justify-between">
//             {isProcessing ? (
//               <Button variant="destructive" size="sm" onClick={handleCancel}>
//                 Cancel
//               </Button>
//             ) : (
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => setIsOpen(false)}
//               >
//                 Close
//               </Button>
//             )}
//             <Button
//               onClick={applyStyle}
//               disabled={isProcessing || !socketConnected}
//               size="sm"
//             >
//               {isProcessing ? (
//                 <div className="flex items-center">
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Processing...
//                 </div>
//               ) : (
//                 "Apply Style"
//               )}
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { stylizeImage, cancelStylization } from "@/utils/stylize-client";
import { StyleOption, getStyleDisplayName } from "@/lib/style-prompts";
import {
  WandSparkles,
  X,
  InfoIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Slider } from "./ui/slider";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";

import { GetSocket } from "@/utils/socket";

interface StylePickerDropdownProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onStyleApplied?: (styledImageData: string, styleType: string) => void;
  onLoading?: (isLoading: boolean) => void;
}

export function StylePicker({
  canvasRef,
  onStyleApplied,
  onLoading,
}: StylePickerDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>("ghibli");
  const [strength, setStrength] = useState<number>(0.8); // Increased default to 0.8
  const [iterations, setIterations] = useState<number>(2); // Default to 2 iterations
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const [enhanceBackground, setEnhanceBackground] = useState<boolean>(true);
  const [fillEmptySpaces, setFillEmptySpaces] = useState<boolean>(true);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [socketConnected, setSocketConnected] = useState<boolean>(true);
  const [serverWarning, setServerWarning] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);

  // Check if we're running in Vercel production environment
  const isVercelProd =
    typeof window !== "undefined" &&
    window.location.hostname.includes("vercel.app");

  // Available styles - reordered by popularity
  const styles: StyleOption[] = [
    "ghibli",
    "anime",
    "realistic",
    "pixar",
    "vangogh",
    "oil",
    "comic-books",
    "cyberpunk",
    "shaun-the-sheep",
    "child-drawing-3d",
  ];

  // Monitor socket connection status
  useEffect(() => {
    const socket = GetSocket();

    // Initial check
    setSocketConnected(socket.connected);

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Show warning for high iteration values on Vercel
  useEffect(() => {
    if (isVercelProd && iterations > 2) {
      setServerWarning(
        "High detail levels may time out on Vercel. Consider using 1-2 for better reliability."
      );
    } else {
      setServerWarning(null);
    }
  }, [iterations, isVercelProd]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      // Check if click is within ShadCN Select portal
      const shadcnSelect = document.querySelector(
        "[data-radix-popper-content-wrapper]"
      );
      if (shadcnSelect && shadcnSelect.contains(event.target as Node)) {
        return; // Don't close dropdown if click was inside Select
      }

      toast.dismiss();
      setIsOpen(false);
    }
  };

  // Set up click outside handler
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    if (isOpen) {
      // If it's already open, closing it
      setIsOpen(false);
      toast.dismiss(); // Close any active toasts
    } else {
      // If it's closed, opening it
      setIsOpen(true);
      toast.info(
        "Adding more details to your drawing improves AI style results!",
        { duration: Infinity }
      );
    }
  };

  const handleCancel = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    await cancelStylization();
    setIsProcessing(false);
    if (onLoading) onLoading(false);
    toast.info("Style transformation cancelled");
  };

  // Estimate processing time based on iterations
  const getEstimatedTime = (iterationCount: number): number => {
    // Base time plus additional time per iteration
    // On Vercel, processing takes longer
    const baseTime = isVercelProd ? 20 : 15;
    const timePerIteration = isVercelProd ? 20 : 15;
    return baseTime + iterationCount * timePerIteration; // in seconds
  };

  const applyStyle = async () => {
    if (!canvasRef.current) {
      setError("Canvas is not available");
      return;
    }

    toast.dismiss();
    // Reset error states
    setError(null);
    setIsTimeout(false);

    // Check socket connection before proceeding
    if (!socketConnected) {
      toast.error("Not connected to server. Please wait for reconnection.");
      return;
    }

    // Estimate time based on iterations
    const estimatedTime = getEstimatedTime(iterations);
    let seconds = estimatedTime;

    try {
      setIsProcessing(true);
      if (onLoading) onLoading(true);

      // Show warning for high detail levels on Vercel
      if (isVercelProd && iterations > 2) {
        toast.warning(
          "High detail levels may time out on Vercel. If you encounter issues, try reducing to level 1-2.",
          { duration: 5000 }
        );
      }

      toastIdRef.current = toast.info(
        `This process may take ${Math.round(estimatedTime / 60)} min ${
          estimatedTime % 60
        }s. Please be patient! (${seconds}s)`,
        {
          duration: Infinity,
        }
      );

      countdownRef.current = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          toast.message(
            `This process may take ${Math.round(estimatedTime / 60)} min ${
              estimatedTime % 60
            }s. Please be patient! (${seconds}s)`,
            {
              id: toastIdRef.current,
              duration: Infinity,
            }
          );
        } else {
          if (countdownRef.current) clearInterval(countdownRef.current);
          toast.message(`Still processing, almost there!`, {
            id: toastIdRef.current,
            duration: Infinity,
          });
        }
      }, 1000);

      const imageData = canvasRef.current.toDataURL("image/png");

      const result = await stylizeImage({
        imageData,
        style: selectedStyle,
        iterations,
        strength,
        enhanceBackground,
        fillEmptySpaces,
      });

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      if (!result.success) {
        // Check specifically for timeout errors
        if (result.isTimeout) {
          setIsTimeout(true);
          setError(
            result.error ||
              "Processing timed out. Try reducing the detail level."
          );

          // Special handling for timeout errors
          toast.error(
            "Processing timed out. Please try again with a lower detail level (1-2).",
            { duration: 8000 }
          );
        } else {
          setError(result.error || "Failed to stylize image");
          toast.error(result.error || "Failed to stylize image");
        }

        setIsProcessing(false);
        if (onLoading) onLoading(false);
        return;
      }

      if (result.styledImage) {
        setProcessingTime(result.processingTime || 0);
        if (onLoading) onLoading(false);
        setIsProcessing(false);

        // Use a slight delay to ensure UI is updated properly
        setTimeout(() => {
          if (onStyleApplied && result.styledImage) {
            onStyleApplied(result.styledImage, selectedStyle);
          }
        }, 100);

        toast.success(
          `Image styled as ${getStyleDisplayName(selectedStyle)} in ${(
            (result.processingTime || 0) / 1000
          ).toFixed(1)}s`
        );

        // Show message if iterations were limited by server
        if (result.parameters?.iterationsLimited) {
          toast.info(
            "Detail level was reduced by the server for performance reasons.",
            { duration: 5000 }
          );
        }
      }
    } catch (error) {
      // Handle JSON parsing errors (common with timeouts)
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        setIsTimeout(true);
        setError("Server timeout. Try reducing the detail level to 1-2.");
        toast.error("Server timeout. Try reducing the detail level to 1-2.");
      } else {
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error(error instanceof Error ? error.message : "Unknown error");
      }
    } finally {
      setIsProcessing(false);
      if (onLoading) onLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip content="Add AI style to your drawing">
        <Button
          variant="outline"
          size="icon"
          className={`"
            relative transition-transform hover-lift duration-300 w-9 h-9 flex items-center justify-center rounded-md border font-medium border-gray-200 shadow-sm
bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white
bg-[length:200%_200%]
animate-moveGradient"
          } ${!socketConnected ? "opacity-50" : ""}`}
          onClick={toggleDropdown}
          disabled={isProcessing || !socketConnected}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WandSparkles className="h-4 w-4" />
          )}
        </Button>
      </Tooltip>

      {isOpen && (
        <div className="absolute left-0 md:left-auto md:right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Apply AI Style</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!socketConnected && (
            <div className="mb-4 rounded-md bg-yellow-50 p-2 text-xs text-yellow-600">
              Server connection lost. Please wait for reconnection.
            </div>
          )}

          {serverWarning && (
            <Alert variant="destructive" className="mb-4 p-2 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription>{serverWarning}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4 grid gap-2">
            <div className="text-xs text-muted-foreground">Style</div>
            <select
              className="w-full rounded-md cursor-pointer border border-primary focus:outline-sage-600 transition-shadow bg-background px-3 py-1 text-sm"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as StyleOption)}
              disabled={isProcessing || !socketConnected}
            >
              {styles.map((style) => (
                <option
                  className="rounded-md border-none"
                  key={style}
                  value={style}
                >
                  {getStyleDisplayName(style)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Strength</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(strength * 100)}%
              </span>
            </div>
            <Slider
              value={[strength * 100]}
              min={10}
              max={100}
              step={5}
              onValueChange={(values) => setStrength(values[0] / 100)}
              disabled={isProcessing || !socketConnected}
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-muted-foreground">
                  Detail Level
                </span>
                {isVercelProd && (
                  <Tooltip content="Values above 2 may cause timeouts on Vercel">
                    <InfoIcon className="h-3 w-3 text-orange-500" />
                  </Tooltip>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {iterations}
              </span>
            </div>
            <Slider
              value={[iterations]}
              min={1}
              max={isVercelProd ? 3 : 5} // Limit max value on Vercel
              step={1}
              onValueChange={(values) => setIterations(values[0])}
              disabled={isProcessing || !socketConnected}
            />
            {isVercelProd && iterations > 2 && (
              <p className="mt-1 text-xs text-orange-500">
                High values may timeout on Vercel
              </p>
            )}
          </div>

          <div className="mb-4">
            <button
              className="text-xs text-sage-600 underline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isProcessing || !socketConnected}
            >
              {showAdvanced ? "Hide" : "Show"} advanced options
            </button>
          </div>

          {showAdvanced && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Enhance Background</span>
                  <Tooltip content="Add contextual background details to empty areas">
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </Tooltip>
                </div>
                <Switch
                  checked={enhanceBackground}
                  onCheckedChange={setEnhanceBackground}
                  disabled={isProcessing || !socketConnected}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs">Fill Empty Spaces</span>
                  <Tooltip content="Automatically add appropriate elements to blank areas">
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </Tooltip>
                </div>
                <Switch
                  checked={fillEmptySpaces}
                  onCheckedChange={setFillEmptySpaces}
                  disabled={isProcessing || !socketConnected}
                />
              </div>
            </div>
          )}

          {error && (
            <div
              className={`mb-4 rounded-md ${
                isTimeout
                  ? "bg-orange-50 text-orange-700"
                  : "bg-red-50 text-red-500"
              } p-2 text-xs`}
            >
              {error}
              {isTimeout && (
                <div className="mt-1 font-medium">
                  Try reducing detail level to 1-2 to avoid timeouts.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {isProcessing ? (
              <Button variant="destructive" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            )}
            <Button
              onClick={applyStyle}
              disabled={isProcessing || !socketConnected}
              size="sm"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                "Apply Style"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
