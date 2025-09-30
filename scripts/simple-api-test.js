// Simple test to verify the API is working
fetch("http://localhost:3000/api/voters", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    firstName: "Test",
    lastName: "User",
    email: `test.user.${Date.now()}@example.com`,
    yearId: "1",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log("Success:", data))
  .catch((error) => console.error("Error:", error));
