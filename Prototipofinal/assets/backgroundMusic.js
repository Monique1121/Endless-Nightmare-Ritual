"use strict";

(function setupBackgroundMusicScope() {
  const MUSIC_VOLUME_KEY = "musicVolume";
  const DEFAULT_VOLUME_PERCENT = 45;

  function clampPercent(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return DEFAULT_VOLUME_PERCENT;
    }

    return Math.max(0, Math.min(100, Math.round(numericValue)));
  }

  function getStoredMusicVolume() {
    const storedValue = localStorage.getItem(MUSIC_VOLUME_KEY);
    if (storedValue === null) {
      return DEFAULT_VOLUME_PERCENT;
    }

    return clampPercent(storedValue);
  }

  function setStoredMusicVolume(value) {
    const safeValue = clampPercent(value);
    localStorage.setItem(MUSIC_VOLUME_KEY, String(safeValue));
    return safeValue;
  }

  function createSceneMusic(audioPath) {
    const audio = new Audio(audioPath);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = getStoredMusicVolume() / 100;

    let hasStarted = false;

    const syncVolume = () => {
      audio.volume = getStoredMusicVolume() / 100;
    };

    const tryPlay = () => {
      syncVolume();

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          hasStarted = false;
        });
      }

      hasStarted = true;
    };

    const resumeFromGesture = () => {
      if (!hasStarted) {
        tryPlay();
      }
    };

    window.addEventListener("pointerdown", resumeFromGesture, { passive: true });
    window.addEventListener("keydown", resumeFromGesture);

    window.addEventListener("pagehide", () => {
      audio.pause();
    });

    tryPlay();

    const controller = {
      audio,
      syncVolume,
      setVolume(value) {
        setStoredMusicVolume(value);
        syncVolume();
      },
    };

    window.__activeSceneMusic = controller;
    return controller;
  }

  function bindMusicSlider(slider) {
    if (!slider) {
      return null;
    }

    slider.value = String(getStoredMusicVolume());
    slider.addEventListener("input", (event) => {
      const newValue = setStoredMusicVolume(event.target.value);
      slider.value = String(newValue);

      if (window.__activeSceneMusic) {
        window.__activeSceneMusic.syncVolume();
      }
    });

    return slider;
  }

  window.BackgroundMusic = {
    bindMusicSlider,
    createSceneMusic,
    getStoredMusicVolume,
    setStoredMusicVolume,
  };
})();