import { mapColor } from './mapcolor.js'
import { args } from './arguments.js'
import { Block } from './blocks.js'

import { exp as EEUniverse } from './EEUniverse.js'

//ui
const top = document.querySelector('#topUi')
const roomId = document.getElementById("roomId");
const roomConnect = document.getElementById("roomIdConnect")
const writeConnect = document.getElementById("writeData")
const changeRoom = document.getElementById("changeroom")
const areas = document.querySelectorAll('.ui.bottom>div:nth-child(1)>button')

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
const uiCtx = ui.getContext("2d")

//static variables
const blockLayers = {
  "bg": [[60, 69], [82, 91], [109, 110]],
  "fg": [[1, 10], [12, 12], [18, 43], [45, 54], [72, 81], [95, 96], [106, 108], [111, 112]],
  "ac": [[0, 0], [11, 11], [13, 17], [44, 44], [55, 59], [70, 71], [92, 94], [97, 105]]
}

const background = new Map();
const foreground = new Map();
let clickAreas = [];
const keyboard = new Map();
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

// resize canvas
gameCanvas.width = worldWidth * 24
gameCanvas.height = worldHeight * 24
miniMapCanvas.width = worldWidth * miniMapSize
miniMapCanvas.height = worldHeight * miniMapSize

// onclickEvents
ui.onclick = event => {
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
  placeBlock(Math.floor((event.clientX - parseFloat(gameCanvas.style.left)) / 24), Math.floor((event.clientY - parseFloat(gameCanvas.style.top)) / 24), event.shiftKey)
}

gameCanvas.onmousemove = event => {
  if (event.which) {
    placeBlock(Math.floor((event.clientX - parseFloat(gameCanvas.style.left)) / 24), Math.floor((event.clientY - parseFloat(gameCanvas.style.top)) / 24), event.shiftKey)
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
    default:
      break;
  }
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

function drawBlock(id, x, y) {
  gameCtx.drawImage(image, (id & 15) * 25, Math.floor(id / 16) * 25, 24, 24, x * 24, y * 24, 24, 24)
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

function drawCanvas() {
  clear()
  clearMinimap()
  drawBackgroundTiles()
  for (const [key, value] of background) {
    drawBlock(value.id, ...key.split(","))
    drawMiniMap(value.id, ...key.split(","))
  }
  for (const [key, value] of foreground) {
    drawBlock(value.id, ...key.split(","))
    drawMiniMap(value.id, ...key.split(","))
  }
}

gameCanvas.style.left = "0px"
gameCanvas.style.top = "0px"
function loop() {
  requestAnimationFrame(loop)
  moveScreen()
}
window.gameCanvas = gameCanvas
loop()
window.onload = () => {
  ui.width = window.innerWidth - 50
  ui.height = 150
  drawCanvas()
}

function placeBlock(x, y, empty) {
  const key = `${x},${y}`
  switch (currentDrawMode) {
    case "draw":
      if (currentId === 0 || empty) {
        if (foreground.has(key)) {
          foreground.delete(key)
        } else if (background.has(key)) {
          background.delete(key)
        }
      } else {
        getLayer(findBlock(currentId)[0]).set(key, new Block(currentId))
      }

      drawMiniMap(12, x, y)
      drawBackground(x, y)
      if (background.get(key)) {
        drawBlock(background.get(key).id, x, y)
        drawMiniMap(background.get(key).id, x, y)
      }
      if (foreground.get(key)) {
        drawBlock(foreground.get(key).id, x, y)
        drawMiniMap(foreground.get(key).id, x, y)
      }
      break;
    case "fill":
      console.log(true)
      let bg = background.get(key)
      let fg = foreground.get(key)
      if (!bg) bg = new Block(0)
      if (!fg) fg = new Block(0)

      if (empty) {
        fill(x, y, bg, fg, null)
      } else {
        fill(x, y, bg, fg, new Block(currentId))
      }
      drawCanvas()
      break;
  }
}

function fill(x, y, bg, fg, newBlock) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  if (newBlock instanceof Block) {
    const layer = findBlock(newBlock.id)[0]
    if (newBlock.id === 0)
      getLayer(layer).delete(`${x},${y}`)
    else
      getLayer(layer).set(`${x},${y}`, newBlock)
    for (const direction of directions) {
      if (x + direction[0] < worldWidth && x + direction[0] >= 0 && y + direction[1] < worldHeight && y + direction[1] >= 0) {
        let oldBg = background.get(`${x + direction[0]},${y + direction[1]}`)
        let oldFg = foreground.get(`${x + direction[0]},${y + direction[1]}`)

        if (oldBg === undefined) oldBg = new Block(0)
        if (oldFg === undefined) oldFg = new Block(0)

        if (oldBg.equals(bg) && oldFg.equals(fg)) {
          let oldBlock = getLayer(layer).get(`${x + direction[0]},${y + direction[1]}`)
          if (oldBlock === undefined) oldBlock = new Block(0)
          if (!oldBlock.equals(newBlock))
            fill(x + direction[0], y + direction[1], bg, fg, newBlock)
        }
      }
    }
  } else {
    background.delete(`${x},${y}`)
    foreground.delete(`${x},${y}`)
    for (const direction of directions) {
      if (x + direction[0] < worldWidth && x + direction[0] >= 0 && y + direction[1] < worldHeight && y + direction[1] >= 0) {
        let oldBg = background.get(`${x + direction[0]},${y + direction[1]}`)
        let oldFg = foreground.get(`${x + direction[0]},${y + direction[1]}`)

        if (oldBg === undefined) oldBg = new Block(0)
        if (oldFg === undefined) oldFg = new Block(0)

        if (oldBg.equals(bg) && oldFg.equals(fg)) {
          fill(x + direction[0], y + direction[1], bg, fg, null)
        }
      }
    }
  }

}

window.addEventListener("keydown", e => {
  if (e.composedPath().indexOf(top) == -1) {
    keyboard.set(e.keyCode, true)
  }
})

window.addEventListener("keyup", e => {
  if (e.composedPath().indexOf(top) == -1) {
    keyboard.delete(e.keyCode)
  }
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
  gameCanvas.style.left = "0px"
  gameCanvas.style.top = "0px"
  let index = 0;
  for (let y = 0; y < worldHeight; y++) {
    for (let x = 0; x < worldWidth; x++) {
      let blocks = initMessage.get(11 + index);
      if (blocks === false) blocks = 0;
      let foregroundBlock = EEUniverse.getFgId(blocks);
      let backgroundBlock = EEUniverse.getBgId(blocks);
      let argumentList = [];// not yet used
      index++
      let maxArguments = args.get(foregroundBlock).length
      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }
      const bg = new Block(backgroundBlock) //this way both fgs and bgs can have arguments. for later implementation though
      const fg = new Block(foregroundBlock, ...argumentList);
      if (bg.id !== 0) {
        background.set(`${x},${y}`, bg)
      }
      if (fg.id !== 0) {
        foreground.set(`${x},${y}`, fg)
      }
    }
  }
  drawCanvas()
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
      let argumentList = [];
      index++
      let maxArguments = args.get(foregroundBlock).length
      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }
      const bg = new Block(backgroundBlock);
      const fg = new Block(foregroundBlock, ...argumentList);

      let newBg = background.get(`${x},${y}`)
      let newFg = foreground.get(`${x},${y}`)

      if (newBg === undefined) newBg = new Block(0)
      if (newFg === undefined) newFg = new Block(0)

      if (!bg.equals(newBg)) {
        connectionServer.send(EEUniverse.MessageType.PlaceBlock, 0, x, y, newBg.id, ...newBg.args);
      }
      if (!fg.equals(newFg)) {
        connectionServer.send(EEUniverse.MessageType.PlaceBlock, 1, x, y, newFg.id, ...newFg.args);
      }
    }
  }
}