import * as THREE from "three";
import { Game } from "./js/Game.js";

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Create and start the game
  const game = new Game();
  game.init();
  game.start();

  // Update loading screen
  const loadingScreen = document.getElementById("loading-screen");
  const loadingFill = document.getElementById("loading-fill");

  // Simulate loading progress
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 5;
    loadingFill.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(loadingInterval);
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  }, 100);
});
