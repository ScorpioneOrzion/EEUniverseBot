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
      var token = document.cookie.split("; ").filter(a => a.includes("token="))[0];
      var editor = document.createElement("iframe");
      var game = document.querySelector("#game-aspect > iframe:nth-child(1)")
      var items = document.createElement("div");
      var gameButton = document.createElement("button");
      var editorButton = document.createElement("button");
      gameButton.style = "clip-path: polygon(86% 0, 100% 100%, 0 100%, 14% 0); width:100px; height:26px; background-color: grey;text-align: center; border:none;";
      editorButton.style = "clip-path: polygon(86% 0, 100% 100%, 0 100%, 14% 0); width:100px; height:26px; background-color: grey;text-align: center; border:none;";
      items.style = "position: absolute; top: 176px;";
      gameButton.innerText = "Game";
      editorButton.innerText = "Editor";
      editor.src = "https://scorpioneorzion.github.io/EEUniverseBot/bot.html";
      editor.style.display = "none"
      gameButton.onclick = () => {
        switch (editor.style.display) {
          case "block":
            editor.style.display = "none"
            game.style.display = "block"
            break;
        }
      }
      editorButton.onclick = () => {
        switch (editor.style.display) {
          case "none":
            game.style.display = "none"
            editor.style.display = "block"
            break;
        }
      }
      items.appendChild(gameButton);
      items.appendChild(editorButton);
      document.body.appendChild(items);
      document.querySelector("#game-aspect > iframe").parentElement.appendChild(editor);
      var valid = false;
      window.addEventListener("keydown", e => {
        if (valid) editor.contentWindow.postMessage(JSON.stringify([e.keyCode, true]), editor.src)
      })
      window.addEventListener("keyup", e => {
        if (valid) editor.contentWindow.postMessage(JSON.stringify([e.keyCode, false]), editor.src)
      })
      window.onload = () => {
        valid = true
        editor.contentWindow.postMessage(token, editor.src)
      }
      break;
  }
})();