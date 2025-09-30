"use client";

import { useEffect, useState } from "react";

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testApi = async () => {
      try {
        const response = await fetch("/api/voters");
        const data = await response.json();
        setResult({ status: response.status, data });
      } catch (error: any) {
        setResult({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>API Test Results</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
