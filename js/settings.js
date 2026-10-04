const THEME_KEY = "lune-theme";
const AUDIO_KEY = "lune-audio";
const THEMES = new Set(["default", "ocean", "forest", "rose", "amber"]);
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

  settings.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    settings.open = true;
  });
  settings.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") settings.open = false;
  });
  settings.querySelector("summary").addEventListener("click", (event) => {
    if (event.detail && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      event.preventDefault();
      settings.open = true;
    }
  });
  settings.addEventListener("focusout", (event) => {
    if (!settings.contains(event.relatedTarget)) settings.open = false;
  });
  settings.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && settings.open) {
      settings.open = false;
      settings.querySelector("summary").focus();
    }
  });

  const root = document.documentElement;
  const AudioContextConstructor = window.AudioContext;
  let audioContext = null;
  let musicMaster = null;
  let musicTimer = null;
  let musicStep = 0;
  let nextMusicTime = 0;
  let audioStarted = false;
  const preferences = readAudioPreferences();
  let musicEnabled = preferences.music;
  let soundsEnabled = preferences.sounds;

  const setStatus = (message) => {
    status.textContent = message;
  };

  const updateAudioControls = () => {
    musicToggle.setAttribute("aria-pressed", String(musicEnabled));
    musicToggle.textContent = musicEnabled ? "Mute calm lo-fi" : "Play calm lo-fi";
    soundsToggle.setAttribute("aria-pressed", String(soundsEnabled));
    soundsToggle.textContent = soundsEnabled ? "Mute UI sounds" : "Enable UI sounds";
    if (!musicEnabled && !soundsEnabled) {
      setStatus("Music and UI sounds are off.");
    } else if (!audioStarted) {
      setStatus("Calm lo-fi and UI sounds start after your first interaction.");
    } else {
      setStatus(
        `${musicEnabled ? "Calm lo-fi is on" : "Music is off"}; UI sounds are ${soundsEnabled ? "on" : "off"}.`
      );
    }
  };

  const saveAudioPreferences = () => {
    try {
      localStorage.setItem(AUDIO_KEY, JSON.stringify({ music: musicEnabled, sounds: soundsEnabled }));
    } catch (error) {
      console.warn("Could not save audio preferences.", error);
    }
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

  const playTone = (
    frequency,
    time,
    duration,
    volume,
    endFrequency = frequency,
    type = "sine",
    output = musicMaster || audioContext.destination
  ) => {
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
    gain.connect(output);
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
    if (!soundsEnabled) suspendAudioIfIdle();
  };

  const startMusic = async () => {
    if (!musicEnabled || musicMaster) return;

    const context = getAudioContext();
    if (!context) {
      musicEnabled = false;
      saveAudioPreferences();
      updateAudioControls();
      setStatus("Background audio is not supported by this browser.");
      return;
    }

    try {
      await context.resume();
      if (!musicEnabled || musicMaster) return;
      musicMaster = context.createGain();
      musicMaster.gain.setValueAtTime(0.0001, context.currentTime);
      musicMaster.gain.setTargetAtTime(0.58, context.currentTime, 0.18);
      musicMaster.connect(context.destination);
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
    } catch (error) {
      console.error("Could not start the calm lo-fi audio.", error);
      setStatus("The browser could not start audio. Try again after interacting with the page.");
    }
  };

  const activateDefaultAudio = async () => {
    if (audioStarted) return;
    audioStarted = true;

    if (!musicEnabled && !soundsEnabled) {
      updateAudioControls();
      return;
    }

    const context = getAudioContext();
    if (!context) {
      musicEnabled = false;
      soundsEnabled = false;
      updateAudioControls();
      setStatus("Audio is not supported by this browser.");
      return;
    }

    try {
      await context.resume();
      if (musicEnabled) await startMusic();
      updateAudioControls();
    } catch (error) {
      console.error("Could not activate default audio.", error);
      setStatus("The browser could not start audio. Try again after interacting with the page.");
    }
  };

  updateAudioControls();
  document.addEventListener("pointerdown", () => void activateDefaultAudio(), { once: true, capture: true });
  document.addEventListener("keydown", () => void activateDefaultAudio(), { once: true, capture: true });

  musicToggle.addEventListener("click", async () => {
    if (musicEnabled) {
      musicEnabled = false;
      stopMusic();
    } else {
      musicEnabled = true;
      await startMusic();
    }
    saveAudioPreferences();
    audioStarted = true;
    updateAudioControls();
  });

  soundsToggle.addEventListener("click", async () => {
    if (soundsEnabled) {
      soundsEnabled = false;
      suspendAudioIfIdle();
    } else {
      const context = getAudioContext();
      if (!context) {
        setStatus("UI sounds are not supported by this browser.");
        return;
      }

      try {
        await context.resume();
        soundsEnabled = true;
        audioStarted = true;
      } catch (error) {
        console.error("Could not enable UI sounds.", error);
        setStatus("The browser could not enable audio. Try again after interacting with the page.");
        return;
      }
    }
    saveAudioPreferences();
    updateAudioControls();
  });

  document.addEventListener("pointerover", (event) => {
    if (!audioContext || !soundsEnabled || event.pointerType !== "mouse" || event.target.closest("[data-settings]")) return;
    const interactive = event.target.closest("a, button, select, summary");
    if (interactive && !interactive.contains(event.relatedTarget)) {
      playTone(720, audioContext.currentTime, 0.055, 0.008, 880, "sine", audioContext.destination);
    }
  });

  document.addEventListener("click", (event) => {
    if (!audioContext || !soundsEnabled || event.target.closest("[data-settings]")) return;
    const interactive = event.target.closest("a, button, select, summary");
    if (interactive) {
      playTone(460, audioContext.currentTime, 0.075, 0.012, 620, "sine", audioContext.destination);
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

function readAudioPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || "null");
    return {
      music: saved?.music !== false,
      sounds: saved?.sounds !== false,
    };
  } catch (error) {
    console.warn("Could not read audio preferences; using audio-on defaults.", error);
    return { music: true, sounds: true };
  }
}
