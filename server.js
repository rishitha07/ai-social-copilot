const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
loadEnvFile(path.join(rootDir, ".env"));

const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "starters", "followUps", "nextSteps", "tips", "practice"],
  properties: {
    summary: { type: "string" },
    starters: stringArraySchema(3),
    followUps: stringArraySchema(3),
    nextSteps: stringArraySchema(3),
    tips: stringArraySchema(3),
    practice: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["speaker", "text"],
        properties: {
          speaker: { type: "string" },
          text: { type: "string" }
        }
      }
    }
  }
};

http
  .createServer(async (req, res) => {
    try {
      if (req.method === "POST" && req.url === "/api/generate") {
        await handleGenerate(req, res);
        return;
      }

      if (req.method === "GET") {
        serveStatic(req, res);
        return;
      }

      sendJson(res, 405, { error: "Method not allowed." });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "Unexpected server error." });
    }
  })
  .listen(port, () => {
    console.log(`AI Social Copilot is running at http://localhost:${port}`);
  });

async function handleGenerate(req, res) {
  const body = await readJsonBody(req);
  const role = safeText(body.role);
  const scenario = safeText(body.scenario);
  const goal = safeText(body.goal);
  const tone = safeText(body.tone);
  const context = safeText(body.context);

  if (!role || !scenario || !goal || !tone) {
    sendJson(res, 400, { error: "Missing one or more required fields." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 503, { error: "OPENAI_API_KEY is missing on the server." });
    return;
  }

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      instructions:
        "You are AI Social Copilot, a practical workplace conversation coach. Return valid JSON only. " +
        "Give culturally aware, supportive, natural workplace guidance for international students and early-career professionals. " +
        "Keep the language warm, specific, and concise. Avoid slang that may confuse non-native speakers.",
      input: [
        {
          role: "user",
          content:
            `Create conversation guidance for this user.\n` +
            `Role: ${role}\n` +
            `Scenario: ${scenario}\n` +
            `Goal: ${goal}\n` +
            `Tone: ${tone}\n` +
            `Extra context: ${context || "None provided"}\n\n` +
            "Provide:\n" +
            "- A one-sentence summary of the coaching approach.\n" +
            "- Three conversation starters.\n" +
            "- Three follow-up responses.\n" +
            "- Three suggestions for what to say next.\n" +
            "- Three culturally aware tips.\n" +
            "- A four-line mini practice script with speakers like AI Coach, You, Coworker, and You."
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "social_copilot_response",
          strict: true,
          schema: responseSchema
        }
      }
    })
  });

  const payload = await openAIResponse.json();

  if (!openAIResponse.ok) {
    const message = payload.error?.message || "The OpenAI request failed.";
    sendJson(res, openAIResponse.status, { error: message });
    return;
  }

  const refusal = extractRefusal(payload);
  if (refusal) {
    sendJson(res, 422, { error: refusal });
    return;
  }

  const structured = extractStructuredPayload(payload);
  sendJson(res, 200, {
    origin: `Live AI guidance via OpenAI (${payload.model || model})`,
    ...structured
  });
}

function serveStatic(req, res) {
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const sanitizedPath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, sanitizedPath);

  if (!filePath.startsWith(rootDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream" });
    res.end(data);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;

      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function extractStructuredPayload(payload) {
  const text = payload.output_text || findOutputText(payload.output || []);
  if (!text) {
    throw new Error("The OpenAI response did not include structured text.");
  }

  return JSON.parse(text);
}

function findOutputText(outputItems) {
  for (const item of outputItems) {
    if (!item.content) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === "output_text" && contentItem.text) {
        return contentItem.text;
      }
    }
  }

  return null;
}

function extractRefusal(payload) {
  const outputItems = payload.output || [];

  for (const item of outputItems) {
    if (!item.content) {
      continue;
    }

    for (const contentItem of item.content) {
      if (contentItem.type === "refusal" && contentItem.refusal) {
        return contentItem.refusal;
      }
    }
  }

  return null;
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stringArraySchema(length) {
  return {
    type: "array",
    minItems: length,
    maxItems: length,
    items: {
      type: "string"
    }
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
