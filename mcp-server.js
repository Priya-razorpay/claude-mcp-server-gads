import express from "express";
import axios from "axios";
import { createServer } from "http";

const app = express();
app.use(express.json());

// ✅ Claude needs this to test the connection
app.get("/sse", (req, res) => {
  console.log("📡 Claude connected to /sse");
  res.status(200).end(); // Must send 200 or Claude marks it as failed
});

// ✅ This is what Claude will call when a user sends a query
app.post("/task", async (req, res) => {
  const { task_id, input } = req.body;

  console.log("🟡 Task received from Claude:", input.query);

  try {
    // 🔁 Forward to your actual n8n webhook (update if needed)
    const n8nResponse = await axios.post(
      "https://priya-pm.app.n8n.cloud/webhook/googleads-query",
      { query: input.query }
    );

    const result = n8nResponse.data;

    // ✅ Send result back to Claude
    await axios.post(`${req.protocol}://${req.get("host")}/task/${task_id}/complete`, {
      output: { result }
    });

    console.log("✅ Task result sent to Claude");
    res.status(200).send("✅ Done");
  } catch (error) {
    console.error("❌ Error processing task:", error.message);

    await axios.post(`${req.protocol}://${req.get("host")}/task/${task_id}/fail`, {
      error: { message: "Failed inside MCP server" }
    });

    res.status(500).send("❌ Error");
  }
});

// 🔌 Start the server
const server = createServer(app);
server.listen(8080, () => {
  console.log("🚀 MCP Server is running on port 8080");
});
