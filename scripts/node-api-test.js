const https = require("https");

// Test data
const testData = {
  firstName: "NodeTest",
  lastName: "User",
  email: `nodetest.${Date.now()}@example.com`,
  yearId: "1",
};

const postData = JSON.stringify(testData);

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/voters",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const jsonData = JSON.parse(data);
      console.log("Response:", jsonData);
    } catch (error) {
      console.log("Raw response:", data);
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.write(postData);
req.end();
