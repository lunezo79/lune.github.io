const REFRESH_INTERVAL = 60_000;
const TIMER_INTERVAL = 1_000;
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
const DEFAULT_ACTIVITY_IMAGE = "assets/icons/favicon.svg";

export function initDiscordActivity() {
  const card = document.querySelector("[data-discord-card]");
  if (!card) return;

  const userId = card.dataset.userId;
  const name = card.querySelector("[data-discord-name]");
  const status = card.querySelector("[data-discord-status]");
  const dot = card.querySelector("[data-discord-dot]");
  const verb = card.querySelector("[data-activity-verb]");
  const activityName = card.querySelector("[data-activity-name]");
  const details = card.querySelector("[data-activity-details]");
  const elapsed = card.querySelector("[data-activity-elapsed]");
  const activityImage = card.querySelector("[data-activity-image]");
  const imageFallback = card.querySelector("[data-activity-fallback]");
  const avatarImages = document.querySelectorAll("[data-discord-avatar]");
  let activityStart = null;

  if (!userId || !/^\d+$/.test(userId)) {
    showError(status, dot, verb, activityName, details, elapsed, new Error("Discord user ID is missing or invalid."));
    return;
  }

  const renderElapsed = () => {
    if (!activityStart) {
      elapsed.textContent = "";
      return;
    }

    const seconds = Math.max(0, Math.floor((Date.now() - activityStart) / 1000));
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    elapsed.textContent = `${hours}:${minutes}:${remainder} elapsed`;
  };

  const setActivityImage = (url) => {
    if (!url) {
      activityImage.hidden = true;
      activityImage.removeAttribute("src");
      imageFallback.hidden = false;
      return;
    }

    activityImage.onload = () => {
      activityImage.hidden = false;
      imageFallback.hidden = true;
    };
    activityImage.onerror = () => {
      activityImage.hidden = true;
      activityImage.removeAttribute("src");
      imageFallback.hidden = false;
    };
    activityImage.src = url;
  };

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
      const discordUser = data.discord_user || {};
      const displayName = discordUser.global_name || discordUser.username;
      if (displayName) name.textContent = displayName;

      if (discordUser.id && discordUser.avatar) {
        const extension = discordUser.avatar.startsWith("a_") ? "gif" : "png";
        const avatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${extension}?size=128`;
        avatarImages.forEach((image) => {
          image.onerror = () => {
            image.src = DEFAULT_ACTIVITY_IMAGE;
          };
          image.src = avatarUrl;
        });
      }

      const discordStatus = data.discord_status || "offline";
      status.textContent = STATUS_LABELS[discordStatus] || "Status unavailable";
      dot.dataset.status = STATUS_LABELS[discordStatus] ? discordStatus : "unknown";
      renderActivity(data);
      renderElapsed();
    } catch (error) {
      showError(status, dot, verb, activityName, details, elapsed, error);
    }
  };

  const renderActivity = (data) => {
    const spotify = data.spotify;
    const activities = Array.isArray(data.activities) ? data.activities : [];
    const current = spotify
      ? null
      : activities.find((item) => item.name && item.type !== 4);

    if (spotify) {
      verb.textContent = "Listening to Spotify";
      activityName.textContent = spotify.song || "Spotify";
      details.textContent = [spotify.artist, spotify.album].filter(Boolean).join(" · ");
      activityStart = Number(spotify.timestamps?.start) || null;
      setActivityImage(spotify.album_art_url || null);
    } else if (current) {
      verb.textContent = ACTIVITY_VERBS[current.type] || "Using";
      activityName.textContent = current.name;
      details.textContent = [current.details, current.state].filter(Boolean).join(" · ");
      activityStart = Number(current.timestamps?.start) || null;
      setActivityImage(getActivityImageUrl(current));
    } else {
      const customStatus = activities.find((item) => item.type === 4 && item.state);
      verb.textContent = "Current activity";
      activityName.textContent = customStatus?.state || "No activity shared right now";
      details.textContent = data.discord_status === "offline" ? "Offline" : "";
      activityStart = null;
      setActivityImage(null);
    }
  };

  void update();
  window.setInterval(() => void update(), REFRESH_INTERVAL);
  window.setInterval(renderElapsed, TIMER_INTERVAL);
}

function getActivityImageUrl(activity) {
  const image = activity.assets?.large_image;
  if (!image) return null;
  if (image.startsWith("https://")) return image;
  if (image.startsWith("mp:")) {
    return `https://media.discordapp.net/${image.slice(3)}`;
  }
  if (image.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${image.slice("spotify:".length)}`;
  }
  if (!activity.application_id) return null;
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png?size=128`;
}

function showError(status, dot, verb, activityName, details, elapsed, error) {
  status.textContent = "Unavailable";
  dot.dataset.status = "unknown";
  verb.textContent = "Current activity";
  activityName.textContent = "Discord activity unavailable";
  details.textContent = "Try again soon.";
  elapsed.textContent = "";
  console.warn("Unable to load Discord activity:", error);
}
