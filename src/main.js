import * as THREE from "three";
import { GameEngine } from "./js/GameEngine.js";

// Add error handling to help debug
window.addEventListener("error", function (event) {
  console.error("Global error:", event.message, event.filename, event.lineno);
  document.body.innerHTML += `<div style="color: red; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: black; padding: 20px; z-index: 1000;">Error: ${event.message}</div>`;
});

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Create and start the game
    console.log("Creating game instance");
    const game = new GameEngine();
    console.log("Initializing game");
    game.init();
    console.log("Starting game");
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
  } catch (error) {
    console.error("Error in game initialization:", error);
    document.body.innerHTML += `<div style="color: red; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: black; padding: 20px; z-index: 1000;">Error: ${error.message}</div>`;
  }
});
