const scenarioData = {
  "team meeting": {
    starters: [
      "That was a helpful discussion. What stood out most to you from the meeting?",
      "I liked your point about the project timeline. How do you usually approach that kind of work?",
      "I am still getting familiar with the team. Is there anything you think I should know going into the next sprint?"
    ],
    followUps: [
      "That makes sense. How did your team handle this in the past?",
      "I would love to learn more about that. What part tends to be the most important?",
      "That is helpful context. Is there a good next step I can take?"
    ],
    nextSteps: [
      "If the conversation is going well, ask about their current priorities.",
      "Connect the topic back to a shared task so the chat feels natural and relevant.",
      "Close by thanking them and suggesting you check in again after the next meeting."
    ],
    tips: [
      "Brief comments after meetings are often welcomed when they are tied to a real topic from the discussion.",
      "Asking one thoughtful question is usually better than trying to sound overly polished.",
      "A calm, curious tone often feels more natural than trying to impress."
    ]
  },
  "lunch break": {
    starters: [
      "Have you tried any good lunch spots around here yet?",
      "How has your day been going so far?",
      "I am still exploring the area. Do you have a favorite place to grab food or coffee?"
    ],
    followUps: [
      "That sounds good. What do you usually order there?",
      "Nice, I have heard a few people mention that place too.",
      "That is good to know. I am trying to get to know the area a little better."
    ],
    nextSteps: [
      "Ask a light follow-up about food, commute, hobbies, or weekend plans.",
      "If they seem open, share one small detail about yourself so the exchange is balanced.",
      "End with something easy like, Maybe I will try that this week."
    ],
    tips: [
      "Lunch conversations are usually more casual than meetings, so simple topics work well.",
      "You do not need a perfect joke or story; curiosity is enough.",
      "If the other person is busy or reserved, keep it short and friendly."
    ]
  },
  "hallway chat": {
    starters: [
      "Hey, how is your day going?",
      "I saw your update earlier. That looked really interesting.",
      "I am still meeting people on the team, so I wanted to say hello."
    ],
    followUps: [
      "That sounds like a busy day. Hope it goes smoothly.",
      "That is interesting. What are you focused on right now?",
      "Nice, I am still learning how everything fits together here."
    ],
    nextSteps: [
      "Keep hallway conversations short unless the other person clearly wants to continue.",
      "Use the moment to build familiarity, not to force a long exchange.",
      "A simple close like, It was nice talking with you, works well."
    ],
    tips: [
      "Short conversations can still build rapport over time.",
      "Friendly consistency matters more than saying something memorable.",
      "If you are nervous, prepare one opening line and one exit line."
    ]
  },
  "manager check-in": {
    starters: [
      "I wanted to check whether I am focusing on the right priorities this week.",
      "I have been reflecting on how I can contribute more effectively. Is there anything you suggest?",
      "I appreciate your feedback from earlier. I have been thinking about how to apply it."
    ],
    followUps: [
      "That is clear, thank you. I can focus on that first.",
      "That helps a lot. Would it be useful if I shared progress again later this week?",
      "I appreciate the guidance. I am trying to build good habits early."
    ],
    nextSteps: [
      "Summarize the main point to show alignment.",
      "Ask one clarifying question if needed, then state the action you will take.",
      "Close with appreciation and confidence rather than apology."
    ],
    tips: [
      "In many workplaces, directness combined with respect is appreciated.",
      "It is okay to ask for clarity; that usually signals responsibility, not weakness.",
      "Keep the conversation focused on goals, ownership, and next steps."
    ]
  },
  "coffee chat": {
    starters: [
      "Thanks for taking the time to chat. I would love to hear about your path into this role.",
      "What has been most interesting about your work lately?",
      "I am trying to understand the team better. What kinds of projects energize you most?"
    ],
    followUps: [
      "That is really helpful perspective.",
      "I like how you described that. It gives me a clearer picture of the team.",
      "That is encouraging to hear, especially as I am still getting started."
    ],
    nextSteps: [
      "Ask about lessons they learned, not just achievements.",
      "Look for a shared interest or working style you can mention naturally.",
      "Finish by thanking them and naming one takeaway from the chat."
    ],
    tips: [
      "People usually respond well when you ask about their experiences with genuine curiosity.",
      "Listening carefully is often more valuable than trying to speak a lot.",
      "A thoughtful thank-you message afterward can strengthen the connection."
    ]
  }
};

const toneStyles = {
  friendly: "Keep the wording light, approachable, and easy to respond to.",
  professional: "Use clear, polished wording that still sounds human.",
  warm: "Lead with empathy and make the other person feel comfortable.",
  confident: "Use concise wording that sounds calm, grounded, and self-assured."
};

const goalAdjustments = {
  "starting a conversation": "Start with a simple opener tied to the moment or setting.",
  "keeping the conversation going": "Use follow-up questions that invite the other person to expand naturally.",
  "joining an existing conversation": "Acknowledge the topic briefly, then add a light question or observation.",
  "ending the conversation naturally": "Close with appreciation and a polite signal that the exchange can pause."
};

const form = document.getElementById("copilot-form");
const emptyState = document.getElementById("empty-state");
const results = document.getElementById("results");
const formStatus = document.getElementById("form-status");
const submitLabel = document.getElementById("submit-label");
const responseOrigin = document.getElementById("response-origin");
const summaryLine = document.getElementById("summary-line");

const startersList = document.getElementById("starters-list");
const followUpsList = document.getElementById("followups-list");
const nextStepsList = document.getElementById("nextsteps-list");
const tipsList = document.getElementById("tips-list");
const practiceScript = document.getElementById("practice-script");

function renderList(target, items) {
  target.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function buildPractice(role, scenario, tone, context) {
  const sceneContext = context
    ? `Given your note, "${context}", focus on sounding natural and specific.`
    : "Keep the conversation short, clear, and easy for the other person to engage with.";

  return [
    {
      speaker: "AI Coach",
      text: `You are a ${role} preparing for a ${scenario}. ${toneStyles[tone]}`
    },
    {
      speaker: "You",
      text: "Hi, I wanted to say hello and ask how things are going for you today."
    },
    {
      speaker: "Coworker",
      text: "It has been a busy day, but good so far. How about you?"
    },
    {
      speaker: "You",
      text: `${sceneContext} A good next line is: "Pretty good, I am still settling in, so I am glad to get to know people a bit better."`
    }
  ];
}

function setStatus(message, type = "info") {
  if (!message) {
    formStatus.className = "form-status hidden";
    formStatus.textContent = "";
    return;
  }

  formStatus.className = `form-status ${type}`;
  formStatus.textContent = message;
}

function setLoading(isLoading) {
  form.querySelector("button").disabled = isLoading;
  submitLabel.textContent = isLoading ? "Generating..." : "Generate guidance";
}

function collectInput() {
  return {
    role: document.getElementById("role").value,
    scenario: document.getElementById("scenario").value,
    goal: document.getElementById("goal").value,
    tone: document.getElementById("tone").value,
    context: document.getElementById("context").value.trim()
  };
}

function buildFallbackResponse({ role, scenario, goal, tone, context }) {
  const base = scenarioData[scenario];

  return {
    origin: "Fallback demo guidance",
    summary: `Showing local demo guidance for a ${role} who wants help with ${goal} during a ${scenario}.`,
    starters: [
      `${goalAdjustments[goal]} ${base.starters[0]}`,
      base.starters[1],
      base.starters[2]
    ],
    followUps: [
      base.followUps[0],
      `${base.followUps[1]} ${toneStyles[tone]}`,
      base.followUps[2]
    ],
    nextSteps: [
      base.nextSteps[0],
      `${base.nextSteps[1]} ${goalAdjustments[goal]}`,
      base.nextSteps[2]
    ],
    tips: [
      base.tips[0],
      `${base.tips[1]} ${toneStyles[tone]}`,
      context ? `Use this personal context when speaking: ${context}` : base.tips[2]
    ],
    practice: buildPractice(role, scenario, tone, context)
  };
}

function renderPractice(lines) {
  practiceScript.innerHTML = "";

  lines.forEach((line) => {
    const item = document.createElement("div");
    item.className = "practice-line";
    item.innerHTML = `<strong>${line.speaker}:</strong> ${line.text}`;
    practiceScript.appendChild(item);
  });
}

function renderResponse(payload) {
  renderList(startersList, payload.starters);
  renderList(followUpsList, payload.followUps);
  renderList(nextStepsList, payload.nextSteps);
  renderList(tipsList, payload.tips);
  renderPractice(payload.practice);

  responseOrigin.textContent = payload.origin;
  summaryLine.textContent = payload.summary;

  emptyState.classList.add("hidden");
  results.classList.remove("hidden");
}

async function generateGuidance(input) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "The AI request could not be completed.");
  }

  return data;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const input = collectInput();

  setLoading(true);
  setStatus("Generating tailored conversation guidance from the AI copilot...");

  try {
    const payload = await generateGuidance(input);
    renderResponse(payload);
    setStatus("");
  } catch (error) {
    const fallback = buildFallbackResponse(input);
    renderResponse(fallback);
    setStatus(`${error.message} Showing local demo guidance so you can still present the product.`, "error");
  } finally {
    setLoading(false);
  }
});
