// ==UserScript==
// @name         EEU editor
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Editor in EEU
// @author       ScorpioneOrzion
// @match        https://ee-universe.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ScorpioneOrzion/EEUniverseBot/master/EEU_editor.user.js
// @downloadURL  https://raw.githubusercontent.com/ScorpioneOrzion/EEUniverseBot/master/EEU_editor.user.js
// ==/UserScript==

(function () {
  'use strict';
  switch (window.location.href) {
    case "https://ee-universe.com/":
      var token = document.cookie.split("; ").filter(a => a.includes("token="))[0];
      var game = document.querySelector("#game-aspect > iframe:nth-child(1)");
      var items = document.createElement("div");
      var gameButton = document.createElement("button");
      var editorButton = document.createElement("button");
      gameButton.style = "clip-path: polygon(86% 0, 100% 100%, 0 100%, 14% 0); width:100px; height:26px; background-color: grey;text-align: center; border:none;";
      editorButton.style = "clip-path: polygon(86% 0, 100% 100%, 0 100%, 14% 0); width:100px; height:26px; background-color: grey;text-align: center; border:none;";
      items.style = "position: absolute; top: 176px;";
      gameButton.innerText = "Game";
      editorButton.innerText = "Editor";
      gameButton.onclick = () => {
        game.contentWindow.postMessage("block", game.src)
      }
      editorButton.onclick = () => {
        game.contentWindow.postMessage("none", game.src)
      }
      items.appendChild(gameButton);
      items.appendChild(editorButton);
      document.body.appendChild(items);
      window.onload = () => {
        game.contentWindow.postMessage(token, game.src)
      }
      break;
    case "https://ee-universe.com/game/index.html":
      var editor = document.createElement("iframe");
      editor.src = "https://scorpioneorzion.github.io/EEUniverseBot/bot.html";
      editor.style = "width: 100vw;height: 100vh;z-index: 1; position: absolute; top: 0px;"
      editor.style.display = "none"
      window.onload = () => {
        document.querySelector("body > script:nth-child(6)").parentElement.appendChild(editor);
      }

      window.addEventListener("message", event => {
        var origin = event.origin || event.originalEvent.origin;
        if (origin !== "https://ee-universe.com") return
        if (event.data == "block") {
          editor.style.display = "none"
        } else if (event.data == "none") {
          editor.style.display = "block"
        } else if (typeof event.data == "string" && event.data.includes("token")) {
          editor.contentWindow.postMessage(event.data, editor.src)
        }
      })

      document.addEventListener("keydown", e => {
        if (editor.style.display == "block") editor.contentWindow.postMessage(JSON.stringify([e.keyCode, true]), editor.src)
      })

      document.addEventListener("keyup", e => {
        if (editor.style.display == "block") editor.contentWindow.postMessage(JSON.stringify([e.keyCode, false]), editor.src)
      })
      break;
  }
})();