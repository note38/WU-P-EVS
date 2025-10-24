// Send credentials functionality has been disabled

export async function POST() {
  return new Response(
    JSON.stringify({ error: "Send credentials functionality has been disabled" }),
    { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
