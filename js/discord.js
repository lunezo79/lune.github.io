const REFRESH_INTERVAL = 60_000;
const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};
const ACTIVITY_VERBS = {
  0: "Playing",
  1: "Streaming",
  2: "Listening to",
  3: "Watching",
  5: "Competing in",
};

export function initDiscordActivity() {
  const card = document.querySelector("[data-discord-card]");
  if (!card) return;

  const userId = card.dataset.userId;
  const name = card.querySelector("[data-discord-name]");
  const status = card.querySelector("[data-discord-status]");
  const dot = card.querySelector("[data-discord-dot]");
  const activity = card.querySelector("[data-discord-activity]");

  if (!userId || !/^\d+$/.test(userId)) {
    showError(status, dot, activity, new Error("Discord user ID is missing or invalid."));
    return;
  }

  const update = async () => {
    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Lanyard returned HTTP ${response.status}.`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "Lanyard returned no Discord presence.");
      }

      const data = result.data;
      const displayName = data.discord_user?.global_name || data.discord_user?.username;
      if (displayName) name.textContent = displayName;

      const discordStatus = data.discord_status || "offline";
      status.textContent = STATUS_LABELS[discordStatus] || "Status unavailable";
      dot.dataset.status = STATUS_LABELS[discordStatus] ? discordStatus : "unknown";
      activity.textContent = getActivityText(data);
    } catch (error) {
      showError(status, dot, activity, error);
    }
  };

  void update();
  window.setInterval(() => void update(), REFRESH_INTERVAL);
}

function getActivityText(data) {
  const activities = Array.isArray(data.activities) ? data.activities : [];
  const current = activities.find((item) => item.name && item.type !== 4);

  if (current) {
    if (current.type === 2 && current.name.toLowerCase() === "spotify") {
      return "Listening to Spotify";
    }

    const verb = ACTIVITY_VERBS[current.type] || "Using";
    const description = [current.details, current.state].filter(Boolean).join(" · ");
    return `${verb} ${current.name}${description ? ` — ${description}` : ""}`;
  }

  const customStatus = activities.find((item) => item.type === 4 && item.state);
  if (customStatus) return `Custom status: ${customStatus.state}`;
  if (data.discord_status === "offline") return "No activity while offline.";
  return "No activity shared right now.";
}

function showError(status, dot, activity, error) {
  status.textContent = "Unavailable";
  dot.dataset.status = "unknown";
  activity.textContent = "Discord activity couldn't be loaded. Try again soon.";
  console.warn("Unable to load Discord activity:", error);
}
