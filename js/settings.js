const THEME_KEY = "lune-theme";
const THEMES = new Set(["default", "ocean", "forest", "rose", "amber"]);
const SYNODIC_MONTH_DAYS = 29.530588853;
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const PHASE_NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
];
const CHORDS = [
  [130.81, 164.81, 196, 233.08],
  [110, 130.81, 164.81, 196],
  [87.31, 110, 130.81, 164.81],
  [98, 123.47, 146.83, 196],
];

export function initSettings() {
  const settings = document.querySelector("[data-settings]");
  const themeSelect = document.querySelector("[data-theme-select]");
  const musicToggle = document.querySelector("[data-music-toggle]");
  const soundsToggle = document.querySelector("[data-sounds-toggle]");
  const status = document.querySelector("[data-settings-status]");
  if (!settings || !themeSelect || !musicToggle || !soundsToggle || !status) return;

  const root = document.documentElement;
  const AudioContextConstructor = window.AudioContext;
  let audioContext = null;
  let musicMaster = null;
  let musicTimer = null;
  let musicStep = 0;
  let nextMusicTime = 0;
  let musicEnabled = false;
  let soundsEnabled = false;

  const setStatus = (message) => {
    status.textContent = message;
  };

  const getAudioContext = () => {
    if (!AudioContextConstructor) return null;
    audioContext ||= new AudioContextConstructor();
    return audioContext;
  };

  const suspendAudioIfIdle = () => {
    window.setTimeout(() => {
      if (!musicEnabled && !soundsEnabled && audioContext?.state === "running") {
        audioContext.suspend().catch((error) => {
          console.warn("Could not suspend the idle audio context.", error);
        });
      }
    }, 350);
  };

  const setTheme = (theme) => {
    const selectedTheme = THEMES.has(theme) ? theme : "default";
    themeSelect.value = selectedTheme;
    if (selectedTheme === "default") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = selectedTheme;
    }

    try {
      localStorage.setItem(THEME_KEY, selectedTheme);
    } catch (error) {
      console.warn("Could not save the selected colour theme.", error);
    }
  };

  let savedTheme = "default";
  try {
    savedTheme = localStorage.getItem(THEME_KEY) || "default";
  } catch (error) {
    console.warn("Could not read the saved colour theme.", error);
  }
  setTheme(savedTheme);
  themeSelect.addEventListener("change", () => setTheme(themeSelect.value));

  const updateMoonPhase = () => {
    const moon = document.querySelector("[data-moon-phase]");
    const light = document.querySelector("[data-moon-light]");
    if (!moon || !light) return;

    const lunarDays = ((Date.now() - REFERENCE_NEW_MOON) / 86400000) % SYNODIC_MONTH_DAYS;
    const phase = (lunarDays + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS / SYNODIC_MONTH_DAYS;
    const illuminated = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    const waxing = phase < 0.5;
    const terminatorRadius = Math.abs(Math.cos(illuminated * Math.PI)) * 10;
    const outerSweep = waxing ? 1 : 0;
    const innerSweep = waxing ? Number(illuminated > 0.5) : Number(illuminated <= 0.5);
    const phaseName = PHASE_NAMES[Math.floor((phase + 0.0625) % 1 * PHASE_NAMES.length)];

    light.setAttribute(
      "d",
      `M 12 2 A 10 10 0 0 ${outerSweep} 12 22 A ${terminatorRadius.toFixed(3)} 10 0 0 ${innerSweep} 12 2 Z`
    );
    moon.setAttribute(
      "aria-label",
      `Moon phase tonight: ${phaseName}, ${Math.round(illuminated * 100)}% illuminated`
    );
    moon.setAttribute("title", moon.getAttribute("aria-label"));
  };
  updateMoonPhase();
  window.setInterval(updateMoonPhase, 60 * 60 * 1000);

  const playTone = (frequency, time, duration, volume, endFrequency = frequency, type = "sine") => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + Math.min(0.025, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(musicMaster || audioContext.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.01);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  };

  const playNoise = (time, duration, volume, cutoff) => {
    if (!audioContext) return;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(musicMaster || audioContext.destination);
    source.start(time);
    source.stop(time + duration);
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  };

  const scheduleMusicStep = (step, time) => {
    const chord = CHORDS[Math.floor(step / 4) % CHORDS.length];
    if (step % 4 === 0) {
      chord.forEach((frequency) => playTone(frequency, time, 2.7, 0.012));
      const bass = chord[0] / 2;
      playTone(bass, time, 0.48, 0.055, bass * 0.98, "triangle");
      playTone(105, time, 0.16, 0.075, 48);
    } else if (step % 4 === 2) {
      playNoise(time, 0.12, 0.025, 1800);
    }
    if (step % 2 === 1) {
      playNoise(time, 0.035, 0.007, 9000);
    }
  };

  const stopMusic = () => {
    musicEnabled = false;
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
    if (musicMaster && audioContext) {
      const oldMaster = musicMaster;
      oldMaster.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
      window.setTimeout(() => oldMaster.disconnect(), 300);
      musicMaster = null;
    }
    suspendAudioIfIdle();
  };

  musicToggle.addEventListener("click", async () => {
    if (musicEnabled) {
      stopMusic();
      musicToggle.setAttribute("aria-pressed", "false");
      musicToggle.textContent = "Play calm lo-fi";
      setStatus(soundsEnabled ? "Music is off; UI sounds are on." : "Music and UI sounds are off.");
      return;
    }

    const context = getAudioContext();
    if (!context) {
      setStatus("Background audio is not supported by this browser.");
      return;
    }

    try {
      await context.resume();
      musicMaster = context.createGain();
      musicMaster.gain.setValueAtTime(0.0001, context.currentTime);
      musicMaster.gain.setTargetAtTime(0.58, context.currentTime, 0.18);
      musicMaster.connect(context.destination);
      musicEnabled = true;
      musicStep = 0;
      nextMusicTime = context.currentTime + 0.05;
      const beatDuration = 60 / 78;
      musicTimer = window.setInterval(() => {
        while (nextMusicTime < context.currentTime + 0.12) {
          scheduleMusicStep(musicStep, nextMusicTime);
          musicStep = (musicStep + 1) % 64;
          nextMusicTime += beatDuration;
        }
      }, 25);
      musicToggle.setAttribute("aria-pressed", "true");
      musicToggle.textContent = "Mute calm lo-fi";
      setStatus(soundsEnabled ? "Calm lo-fi is playing; UI sounds are on." : "Calm lo-fi is playing; UI sounds are off.");
    } catch (error) {
      console.error("Could not start the calm lo-fi audio.", error);
      setStatus("The browser could not start audio. Try again after interacting with the page.");
    }
  });

  soundsToggle.addEventListener("click", async () => {
    if (soundsEnabled) {
      soundsEnabled = false;
      soundsToggle.setAttribute("aria-pressed", "false");
      soundsToggle.textContent = "Enable UI sounds";
      setStatus(musicEnabled ? "Calm lo-fi is playing; UI sounds are off." : "Music and UI sounds are off.");
      suspendAudioIfIdle();
      return;
    }

    const context = getAudioContext();
    if (!context) {
      setStatus("UI sounds are not supported by this browser.");
      return;
    }

    try {
      await context.resume();
      soundsEnabled = true;
      soundsToggle.setAttribute("aria-pressed", "true");
      soundsToggle.textContent = "Mute UI sounds";
      setStatus(musicEnabled ? "Calm lo-fi and UI sounds are on." : "UI sounds are on; music is off.");
    } catch (error) {
      console.error("Could not enable UI sounds.", error);
      setStatus("The browser could not enable audio. Try again after interacting with the page.");
    }
  });

  document.addEventListener("pointerover", (event) => {
    if (!soundsEnabled || event.pointerType !== "mouse" || event.target.closest("[data-settings]")) return;
    const interactive = event.target.closest("a, button, select, summary");
    if (interactive && !interactive.contains(event.relatedTarget)) {
      playTone(720, audioContext.currentTime, 0.055, 0.008, 880);
    }
  });

  document.addEventListener("click", (event) => {
    if (!soundsEnabled || event.target.closest("[data-settings]")) return;
    const interactive = event.target.closest("a, button, select, summary");
    if (interactive) {
      playTone(460, audioContext.currentTime, 0.075, 0.012, 620);
    }
  });

  const updateProjectAccent = (activeView) => {
    const activeSection = document.getElementById(activeView);
    const projectAccent = activeSection?.dataset.projectAccent;
    if (projectAccent) {
      root.dataset.projectAccent = projectAccent;
    } else {
      delete root.dataset.projectAccent;
    }
  };

  updateProjectAccent(document.querySelector("[data-header]")?.dataset.activeView || "top");
  document.addEventListener("pageviewchange", (event) => {
    updateProjectAccent(event.detail.activeView);
  });
}
