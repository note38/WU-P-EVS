// "use client";

// import { useUser } from "@clerk/nextjs";
// import { useState } from "react";

// export default function TestAuthPage() {
//   const { user, isLoaded, isSignedIn } = useUser();
//   const [testResult, setTestResult] = useState<string>("");

//   const testDatabaseConnection = async () => {
//     try {
//       const response = await fetch("/api/auth/check-user-sync");
//       const data = await response.json();
//       setTestResult(JSON.stringify(data, null, 2));
//     } catch (error) {
//       setTestResult(`Error: ${error}`);
//     }
//   };

//   const testEmailCheck = async () => {
//     try {
//       const response = await fetch("/api/auth/check-email", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: "admin@example.com" }),
//       });
//       const data = await response.json();
//       setTestResult(JSON.stringify(data, null, 2));
//     } catch (error) {
//       setTestResult(`Error: ${error}`);
//     }
//   };

//   const manualSync = async () => {
//     try {
//       const response = await fetch("/api/auth/manual-sync", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//       });
//       const data = await response.json();
//       setTestResult(JSON.stringify(data, null, 2));
//     } catch (error) {
//       setTestResult(`Error: ${error}`);
//     }
//   };

//   const directSync = async () => {
//     try {
//       const response = await fetch("/api/auth/direct-sync", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//       });
//       const data = await response.json();
//       setTestResult(JSON.stringify(data, null, 2));
//     } catch (error) {
//       setTestResult(`Error: ${error}`);
//     }
//   };

//   return (
//     <div className="min-h-screen p-8">
//       <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>

//       <div className="space-y-4">
//         <div className="p-4 border rounded">
//           <h2 className="font-semibold mb-2">Clerk Status:</h2>
//           <p>Loaded: {isLoaded ? "Yes" : "No"}</p>
//           <p>Signed In: {isSignedIn ? "Yes" : "No"}</p>
//           <p>User ID: {user?.id || "None"}</p>
//           <p>Email: {user?.emailAddresses[0]?.emailAddress || "None"}</p>
//         </div>

//         <div className="p-4 border rounded">
//           <h2 className="font-semibold mb-2">Environment Variables:</h2>
//           <p>
//             Publishable Key:{" "}
//             {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "Set" : "Not Set"}
//           </p>
//           <p>
//             Sign In URL:{" "}
//             {process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "Not Set"}
//           </p>
//           <p>
//             After Sign In URL:{" "}
//             {process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "Not Set"}
//           </p>
//         </div>

//         <div className="p-4 border rounded">
//           <h2 className="font-semibold mb-2">Test Actions:</h2>
//           <div className="space-y-2">
//             <button
//               onClick={testDatabaseConnection}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Test Database Connection
//             </button>
//             <button
//               onClick={testEmailCheck}
//               className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
//             >
//               Test Email Check
//             </button>
//             <button
//               onClick={manualSync}
//               className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ml-2"
//             >
//               Manual Sync
//             </button>
//             <button
//               onClick={directSync}
//               className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 ml-2"
//             >
//               Direct Sync
//             </button>
//           </div>
//         </div>

//         {testResult && (
//           <div className="p-4 border rounded">
//             <h2 className="font-semibold mb-2">Test Result:</h2>
//             <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
//               {testResult}
//             </pre>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
