// // hooks/useIdleTimeout.js
// import { signOut } from "next-auth/react";
// import { useEffect, useState } from "react";

// export function useIdleTimeout({ timeout = 300000, isActive = true }) {
//   const [isIdle, setIsIdle] = useState(false);

//   useEffect(() => {
//     // Only set up the timeout if isActive is true
//     if (!isActive) return;

//     let idleTimer;

//     // Function to reset the timer
//     const resetTimer = () => {
//       clearTimeout(idleTimer);
//       setIsIdle(false);
//       idleTimer = setTimeout(() => {
//         // User is idle, log them out
//         setIsIdle(true);
//         signOut({ redirect: true, callbackUrl: "/" });
//       }, timeout);
//     };

//     // Events that would reset the timer
//     const events = [
//       "mousedown",
//       "mousemove",
//       "keypress",
//       "scroll",
//       "touchstart",
//       "click",
//     ];

//     // Add event listeners
//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer);
//     });

//     // Initialize timer
//     resetTimer();

//     // Cleanup event listeners
//     return () => {
//       clearTimeout(idleTimer);
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer);
//       });
//     };
//   }, [timeout, isActive]);

//   return { isIdle };
// }
