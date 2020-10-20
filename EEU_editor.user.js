// ==UserScript==
// @name         EEU editor
// @namespace    http://tampermonkey.net/
// @version      0.3
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

      break;
    case "https://ee-universe.com/game/index.html":

      var token = document.cookie.split("; ").filter(a => a.includes("token="))[0];
      var editor = document.createElement("iframe");
      editor.src = "https://scorpioneorzion.github.io/EEUniverseBot/bot.html";
      editor.style = "width: 100vw; height: 100vh;"
      editor.style.display = "none"
      window.onload = () => {
        document.querySelector("body > div:nth-child(7)").parentElement.appendChild(editor);
        editor.contentWindow.postMessage(token, editor.src)
      }

      window.addEventListener("message", event => {
        if (event.origin !== "https://ee-universe.com") return
        if (event.data == "block") {
          document.querySelector("body > div:nth-child(7)").style.display = "block"
          editor.style.display = "none"
        } else if (event.data == "none") {
          document.querySelector("body > div:nth-child(7)").style.display = "none"
          editor.style.display = "block"
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