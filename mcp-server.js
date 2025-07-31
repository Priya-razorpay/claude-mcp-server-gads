import express from "express";
import axios from "axios";
import { createServer } from "http";

const app = express();
app.use(express.json());

// === Replace this with the SSE URL Claude gives you (once MCP connects) ===
const CLAUDE_SSE_BASE = "https://YOUR-SSE-URL-FROM-CLAUDE";

// === Your n8n webhook URL for Google Ads queries ===
const N8N_WEBHOOK_URL = "https://priya-pm.app.n8n.cloud/webhook/googleads-query";

// Route Claude will call with the task
app.post("/task", async (req, res) => {
  const { task_id, input } = req.body;

  console.log("🟡 Task received from Claude:", input.query);

  try {
    // Forward query to your n8n webhook
    const n8nResponse = await axios.post(N8N_WEBHOOK_URL, {
      query: input.query
    });

    const result = n8nResponse.data;

    console.log("🟢 Response from n8n:", result);

    // Send result back to Claude
    await axios.post(`${CLAUDE_SSE_BASE}/task/${task_id}/complete`, {
      output: { result }
    });

    res.status(200).send("✅ Task completed and response sent to Claude");
  } catch (error) {
    console.error("🔴 Error in task:", error.message);

    // Send failure back to Claude
    await axios.post(`${CLAUDE_SSE_BASE}/task/${task_id}/fail`, {
      error: { message: "Failed to process task in MCP server." }
    });

    res.status(500).send("❌ Task failed");
  }
});

const server = createServer(app);
server.listen(8080, () => {
  console.log("🚀 Claude MCP Server is running on port 8080");
});
app.get("/sse", (req, res) => {
  console.log("📡 Claude connected to /sse endpoint");
  res.status(200).end(); // just keep it simple
});

