import { mapColor } from './static files/mapcolor.js'
import { args } from './arguments.js'
import { Block } from './static files/blocks.js'

import { exp as EEUniverse } from './connect/EEUniverse.js'

//ui
const roomId = document.getElementById("roomId");
const roomConnect = document.getElementById("roomIdConnect")
const writeConnect = document.getElementById("writeData")
const changeRoom = document.getElementById("changeroom")
const areas = document.querySelectorAll('.ui.bottom>div:nth-child(1)>button')
const miniMapToggle = document.getElementById('miniMapToggle')
const argsEdit = document.getElementById('edit-arguments')
const exitEdit = document.getElementById('edit-exit')
const titelEdit = document.getElementById('title-args')
const draw = document.getElementById('draw')
const drawMode = document.getElementById('drawMode').children[1]

//images
const image = new Image()
image.src = './AllBlocks.png'
const ground = new Image()
ground.src = './ground.png'

//canvas
const gameCanvas = document.querySelector("body > canvas:nth-child(1)")
const gameCtx = gameCanvas.getContext("2d");
const miniMapCanvas = document.querySelector("body > canvas:nth-child(2)")
const miniMapCtx = miniMapCanvas.getContext("2d");
const ui = document.getElementById('ui');
const uiCtx = ui.getContext("2d");

//static variables
const blockLayers = {
  "bg": [[60, 69], [82, 91], [109, 110]],
  "fg": [[1, 10], [12, 12], [18, 43], [45, 54], [72, 81], [95, 96], [106, 108], [111, 112]],
  "ac": [[0, 0], [11, 11], [13, 17], [44, 44], [55, 59], [70, 71], [92, 94], [97, 105]]
}

const background = new Map();
const foreground = new Map();
const keyboard = new Map();
const argument = new Map();

let clickAreas = [];
let token;
let connectionServer;
let place = false;

//changing variables
let worldWidth = 50;
let worldHeight = 50;
let miniMapSize = 2;

let currentDrawMode = "draw";
let currentId = 0;
let areaValue = 0;

//init functions
for (const arg of args) {
  if (arg[1].length === 0) continue
  let argumentList = []
  let rotate = -1;
  for (let i = 0; i < arg[1].length; i++) {
    switch (typeof arg[1][i]) {
      case "number":
        argumentList.push([0, arg[1][i]])
        if (arg[1][i] == 3) {
          rotate = i
        }
        break;
      case "string":
        argumentList.push(["", parseInt(arg[1][i].split(/\D/).join(""))])
        break;
    }
  }
  if (rotate !== -1) {
    argumentList.r = rotate
  }
  argument.set(arg[0], argumentList)
}
argsEdit.style.display = "none"

// onclickEvents
exitEdit.onclick = () => {
  argsEdit.style.display = "none"
}

draw.onclick = () => {
  drawMode.classList.toggle('open')
}

for (const child of drawMode.children) {
  child.onclick = () => {
    currentDrawMode = child.innerText.toLowerCase()
    drawMode.classList.toggle('open')
  }
}

ui.onclick = event => {
  if (argsEdit.style.display !== "none") return
  let x = event.clientX - 50
  let y = event.clientY - window.innerHeight + 150
  for (const area of clickAreas) {
    if (area[0] <= x && (area[0] + 24) >= x && (area[1]) <= y && (area[1] + 24) >= y) {
      currentId = area[2]
      drawUiFull(area[3])
      break;
    }
  }
}

gameCanvas.onclick = event => {
  if (argsEdit.style.display !== "none") return
  const x = Math.floor((event.clientX - parseFloat(gameCanvas.style.left)) / 24)
  const y = Math.floor((event.clientY - parseFloat(gameCanvas.style.top)) / 24)
  const key = getKey(x, y)
  switch (currentDrawMode) {
    case "draw":
      placeBlock(x, y, lastArg(event, key))
      break;
    case "fill":
      fillBlock(x, y, background.get(key), foreground.get(key), lastArg(event, key))
      drawCanvas(false)
      break;
    case "replace":
      replaceBlock(getLayer(findBlock(currentId)[0]).get(key), lastArg(event, key))
      break;
  }
}

gameCanvas.oncontextmenu = event => {
  if (argsEdit.style.display !== "none") return
  const x = Math.floor((event.clientX - parseFloat(gameCanvas.style.left)) / 24)
  const y = Math.floor((event.clientY - parseFloat(gameCanvas.style.top)) / 24)
  const key = getKey(x, y)

  let fg = foreground.get(key)
  if (fg) {
    if (argument.get(fg.id) == undefined) {
      return
    } else if (typeof argument.get(fg.id)?.r == "number" && fg.args.length == 1) {
      let fgArgs = argument.get(fg.id)
      fgArgs[fgArgs.r][0] = fg.args[fgArgs.r] = fg.args[fgArgs.r] + 1 & 3

      drawBackground(x, y)
      if (background.get(key)) {
        drawBlock(background.get(key).id, x, y, background.get(key).args[argument.get(background.get(key).id)?.r] ?? 0)
        drawMiniMap(background.get(key).id, x, y)
      }
      drawBlock(fg.id, x, y, fg.args[fgArgs.r] ?? 0)
      drawMiniMap(fg.id, x, y)
    } else {
      argsEdit.style.display = "block"
      switch (fg.id) {
        case 55:
        case 56:
        case 57:
        case 58:
          titelEdit.innerText = "Sign"
          break;
        case 59:
          titelEdit.innerText = "Portal"
          break;
        default:
          titelEdit.innerText = "Block value"
          break;
      }
    }
  }
}

gameCanvas.onmousemove = event => {
  if (argsEdit.style.display !== "none") return
  const x = Math.floor((event.clientX - parseFloat(gameCanvas.style.left)) / 24)
  const y = Math.floor((event.clientY - parseFloat(gameCanvas.style.top)) / 24)
  const key = getKey(x, y)
  switch (currentDrawMode) {
    case "draw":
      switch (event.which) {
        case 1:
        case 3:
          placeBlock(x, y, lastArg(event, key))
          break;
      }
      break;
    case "fill":
      switch (event.which) {
        case 1:
        case 3:
          fillBlock(x, y, background.get(key), foreground.get(key), lastArg(event, key))
          drawCanvas(false)
          break;
      }
      break;
    case "replace":
      switch (event.which) {
        case 1:
        case 3:
          replaceBlock(getLayer(findBlock(currentId)[0]).get(key), lastArg(event, key))
          break;
      }
      break;
  }
}

let currentLayer = -1;
areas.forEach(element => {
  element.value = areaValue++
  element.onclick = () => {
    document.querySelector('button.selected')?.classList.remove('selected')
    element.classList.add('selected')
    drawUiFull(element.value)
    currentLayer = element.value
  }
})

miniMapToggle.onclick = () => {
  miniMapCanvas.hidden = !miniMapCanvas.hidden
}

//general Functions
function findBlock(id) {
  if (blockLayers.bg.some(list => list[1] >= id && list[0] <= id)) return [0, 2];
  if (blockLayers.fg.some(list => list[1] >= id && list[0] <= id)) return [1, 0];
  if (blockLayers.ac.some(list => list[1] >= id && list[0] <= id)) return [1, 1];
  return null;
}

function getLayer(layer) {
  switch (layer) {
    case 0:
      return background
    case 1:
      return foreground
  }
}

function getKey(x, y) {
  return `${x},${y}`
}

function lastArg(event, key) {
  return event.shiftKey ? foreground.get(key).id !== 0 ? 1 : 0 : makeBlock(currentId)
}

//drawFunctions
function drawBackgroundTiles() {
  for (let width = 0; width < worldWidth; width++) {
    for (let height = 0; height < worldHeight; height++) {
      drawBackground(width, height)
    }
  }
}

function drawBackground(x, y) {
  gameCtx.drawImage(ground, x * 24, y * 24, 24, 24)
}

function drawUi(id, x, y) {
  uiCtx.drawImage(ground, x, y, 24, 24)
  uiCtx.drawImage(image, (id & 15) * 25, Math.floor(id / 16) * 25, 24, 24, x, y, 24, 24)
}

function drawBlock(id, x, y, angle) {
  gameCtx.save();
  gameCtx.translate(x * 24, y * 24);
  gameCtx.rotate(angle * Math.PI / 2);
  let rotate = ((_) => [(0 - (-_[0])) * -24, (_[0] ^ _[1]) * -24])((4 + (angle & 3)).toString(2).slice(-2))
  gameCtx.drawImage(image, (id & 15) * 25, Math.floor(id / 16) * 25, 24, 24, ...rotate, 24, 24)
  gameCtx.restore();
}

function drawMiniMap(id, x, y) {
  if (mapColor.get(id) == -1) return
  miniMapCtx.beginPath()
  miniMapCtx.rect(x * miniMapSize, y * miniMapSize, miniMapSize, miniMapSize)
  if (mapColor.get(id) == -2) miniMapCtx.fillStyle = "#000000"
  else miniMapCtx.fillStyle = "#" + mapColor.get(id).toString(16)
  miniMapCtx.fill()
}

function drawUiFull(p) {
  let j = 0
  let k = 0
  clearUi()
  clickAreas = []
  while (findBlock(k) !== null) {
    if (findBlock(k)[1] == p) {
      if (currentId == k) {
        uiCtx.beginPath()
        uiCtx.rect((24 + j) % (ui.width - 48) - 1, Math.floor((24 + j) / (ui.width - 48)) * 30 + 11, 26, 26)
        uiCtx.stroke()
      }
      clickAreas.push([(24 + j) % (ui.width - 48), Math.floor((24 + j) / (ui.width - 48)) * 30 + 12, k, p])
      drawUi(k, (24 + j) % (ui.width - 48), Math.floor((24 + j) / (ui.width - 48)) * 30 + 12)
      j += 25
    }
    k++
  }
}

//clear functions
function clear() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height)
}

function clearMinimap() {
  miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height)
}

function clearUi() {
  uiCtx.clearRect(0, 0, ui.width, ui.height)
}

//movement
function moveScreen() {
  const speed = 10
  const left = keyboard.has(37) || keyboard.has(65)
  const right = keyboard.has(39) || keyboard.has(68)
  const down = keyboard.has(38) || keyboard.has(87)
  const up = keyboard.has(40) || keyboard.has(83)
  if (down ^ up) {
    if (down) {
      gameCanvas.style.top = parseFloat(gameCanvas.style.top) + speed + "px"
    } else {
      gameCanvas.style.top = parseFloat(gameCanvas.style.top) - speed + "px"
    }
  }
  if (left ^ right) {
    if (left) {
      gameCanvas.style.left = parseFloat(gameCanvas.style.left) + speed + "px"
    } else {
      gameCanvas.style.left = parseFloat(gameCanvas.style.left) - speed + "px"
    }
  }
}

//drawFull canvas
function drawCanvas(toggle) {
  if (toggle) {
    gameCanvas.width = worldWidth * 24
    gameCanvas.height = worldHeight * 24
    miniMapCanvas.height = worldHeight * miniMapSize
    miniMapCanvas.width = worldWidth * miniMapSize
    gameCanvas.style.left = "0px"
    gameCanvas.style.top = "0px"
  }

  clear()
  clearMinimap()
  drawBackgroundTiles()

  for (const [key, value] of background) {
    if (value.id == 0) continue
    drawBlock(value.id, ...key.split(","), value.args[argument.get(value.id)?.r] ?? 0)
    drawMiniMap(value.id, ...key.split(","))
  }
  for (const [key, value] of foreground) {
    if (value.id == 0) continue
    drawBlock(value.id, ...key.split(","), value.args[argument.get(value.id)?.r] ?? 0)
    drawMiniMap(value.id, ...key.split(","))
  }
}

//setup
gameCanvas.style.left = "0px"
gameCanvas.style.top = "0px"
function loop() {
  requestAnimationFrame(loop)
  moveScreen()
  ui.width = 906
  drawUiFull(currentLayer)
}
window.onload = () => {
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      foreground.set(getKey(x, y), makeBlock(0))
      background.set(getKey(x, y), makeBlock(0))
    }
  }
  loop()
  drawCanvas(true)
}
window.foreground = foreground
window.background = background

//emptyblock
function makeBlock(id) {
  return new Block(id, ...(argument.get(id) ?? []).map(value => value[0]))
}

function placeBlock(x, y, newBlock) {
  const key = getKey(x, y)
  if (typeof newBlock == "number") {
    if (newBlock) {
      foreground.set(key, makeBlock(0))
    } else {
      background.set(key, makeBlock(0))
    }
  }
  else getLayer(findBlock(newBlock.id)[0]).set(key, newBlock)

  drawMiniMap(12, x, y)
  drawBackground(x, y)
  if (background.get(key).id !== 0) {
    drawBlock(background.get(key).id, x, y, background.get(key).args[argument.get(background.get(key).id)?.r] ?? 0)
    drawMiniMap(background.get(key).id, x, y)
  }
  if (foreground.get(key).id !== 0) {
    drawBlock(foreground.get(key).id, x, y, foreground.get(key).args[argument.get(foreground.get(key).id)?.r] ?? 0)
    drawMiniMap(foreground.get(key).id, x, y)
  }
}

function fillBlock(x, y, oldBG, oldFG, newBlock) {
  const directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }]
  const key = getKey(x, y)
  if (typeof newBlock == "number") {
    if (newBlock) {
      foreground.set(key, makeBlock(0))
    } else {
      background.set(key, makeBlock(0))
    }
    for (const direction of directions) {
      if (!(0 <= (x + direction.x) && (x + direction.x) < worldWidth)) continue
      if (!(0 <= (y + direction.y) && (y + direction.y) < worldHeight)) continue
      const newKey = getKey(x + direction.x, y + direction.y)
      let oldBg = background.get(newKey)
      let oldFg = foreground.get(newKey)
      if (oldBg.equals(oldBG) && oldFg.equals(oldFG) && !(oldBg.id === 0 && oldFg.id === 0)) {
        fillBlock(x + direction.x, y + direction.y, oldBG, oldFG, newBlock)
      }
    }
  } else {
    const layer = findBlock(newBlock.id)[0]
    getLayer(layer).set(key, newBlock)
    for (const direction of directions) {
      if (!(0 <= (x + direction.x) && (x + direction.x) < worldWidth)) continue
      if (!(0 <= (y + direction.y) && (y + direction.y) < worldHeight)) continue
      const newKey = getKey(x + direction.x, y + direction.y)
      let oldBg = background.get(newKey)
      let oldFg = foreground.get(newKey)

      if (oldBg.id === newBlock.id || oldFg.id === newBlock.id) continue
      if (oldBg.equals(oldBG) && oldFg.equals(oldFG)) {
        fillBlock(x + direction.x, y + direction.y, oldBG, oldFG, newBlock)
      }
    }
  }
}

function replaceBlock(oldBlock, newBlock) {
  let replacement = new Map()
  if (typeof newBlock === "number" && newBlock === 1) {
    for (const [key, value] of background) {
      if (value.id == oldBlock.id) replacement.set(key, makeBlock(0))
    }
    for (const [key, value] of replacement) {
      background.set(key, value)
    }
  } else if (typeof newBlock === "number" && newBlock === 0) {
    for (const [key, value] of foreground) {
      if (value.id == oldBlock.id) replacement.set(key, makeBlock(0))
    }
    for (const [key, value] of replacement) {
      foreground.set(key, value)
    }
  } else {
    for (const [key, value] of background) {
      if (value.id == oldBlock.id) replacement.set(key, newBlock)
    }
    for (const [key, value] of replacement) {
      background.set(key, value)
    }
    replacement = new Map()
    for (const [key, value] of foreground) {
      if (value.id == oldBlock.id) replacement.set(key, newBlock)
    }
    for (const [key, value] of replacement) {
      foreground.set(key, value)
    }
  }
  drawCanvas(false)
}

//eventlisteners
window.addEventListener("keydown", event => {
  keyboard.set(event.which, true)
})

window.addEventListener("keyup", event => {
  keyboard.delete(event.which)
})

window.addEventListener("message", event => {
  var origin = event.origin || event.originalEvent.origin;
  if (origin !== "https://ee-universe.com/game/index.html" && origin !== "https://ee-universe.com") return
  if (typeof event.data == "string") {
    if (event.data.includes("token")) {
      token = event.data.split("token=")[1];
      (async function () {
        connectionServer = await connect(token)
      })()
    } else {
      const value = JSON.parse(event.data);
      if (value[1]) {
        keyboard.set(value[0], true);
      } else {
        keyboard.delete(value[0]);
      }
    }
  }
})

roomConnect.onclick = () => {
  if (connectionServer !== undefined) {
    place = false;
    connectionServer.joinRoom(roomId.value);
    connectionServer.send(EEUniverse.MessageType.Init, 0);
  }
}

writeConnect.onclick = () => {
  if (connectionServer !== undefined) {
    place = true;
    connectionServer.joinRoom(roomId.value);
    connectionServer.send(EEUniverse.MessageType.Init, 0);
  }
}

changeRoom.onclick = () => {
  roomId.value = prompt("Enter roomId", roomId.value)
}

window.connectTo = async (authToken) => {
  connectionServer = await connect(authToken)
  return connectionServer
}
//connecting
async function connect(authToken) {
  let server;
  await EEUniverse.connect(authToken).then(function (connection) {
    connection.onMessage(msg => {
      switch (msg.scope) {
        case EEUniverse.ConnectionScope.World: //world scope
          switch (msg.type) {
            case EEUniverse.MessageType.Init: //init message
              // do stuff with init
              // connection.send(EEUniverse.MessageType.Chat, "Bot successfully connected."); //now to the most important part for EEU Editor
              //leave world if loading world
              if (place == false) {
                BlockHandeler(msg)
              } else {
                CheckDifference(msg)
              }
              connection.leaveRoom()
              break;
          }
          break;
      }
    });
    server = connection
  }).then(() => {
    console.log("Bot connected");
  }).catch(function (err) {
    console.log(err);
  });
  return server;
}

function BlockHandeler(initMessage) { //false = 0
  foreground.clear()
  background.clear()
  worldWidth = initMessage.get(9)
  worldHeight = initMessage.get(10)
  console.log(initMessage.get(9), worldWidth, initMessage.get(10), worldHeight)
  gameCanvas.style.left = "0px"
  gameCanvas.style.top = "0px"
  let index = 0;
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      let blocks = initMessage.get(11 + index);
      if (blocks === false) blocks = 0;

      let foregroundBlock = EEUniverse.getFgId(blocks);
      let backgroundBlock = EEUniverse.getBgId(blocks);
      let key = getKey(x, y)
      let argumentList = [];// not yet used
      index++

      let maxArguments = args.get(foregroundBlock).length

      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }

      const bg = new Block(backgroundBlock) //this way both fgs and bgs can have arguments. for later implementation though
      const fg = new Block(foregroundBlock, ...argumentList);

      background.set(key, bg)
      foreground.set(key, fg)
    }
  }
  drawCanvas(true)
}

function CheckDifference(initMessage) {
  let width = initMessage.get(9)
  let heigth = initMessage.get(10)
  let index = 0
  for (let y = 0; y < heigth; y++) {
    for (let x = 0; x < width; x++) {
      let blocks = initMessage.get(11 + index);
      if (blocks === false) blocks = 0;

      let foregroundBlock = EEUniverse.getFgId(blocks);
      let backgroundBlock = EEUniverse.getBgId(blocks);
      let key = getKey(x, y)
      let argumentList = [];
      index++

      let maxArguments = args.get(foregroundBlock).length
      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }

      const bg = new Block(backgroundBlock);
      const fg = new Block(foregroundBlock, ...argumentList);

      let newBg = background.get(key)
      let newFg = foreground.get(key)

      if (!bg.equals(newBg)) {
        connectionServer.send(EEUniverse.MessageType.PlaceBlock, 0, x, y, newBg.id, ...newBg.args);
      }
      if (!fg.equals(newFg)) {
        connectionServer.send(EEUniverse.MessageType.PlaceBlock, 1, x, y, newFg.id, ...newFg.args);
      }
    }
  }
}

//image imports, text, shapes, etc..