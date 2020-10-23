import { mapColor } from './mapcolor.js'
import { args } from './arguments.js'
import { Block } from './blocks.js'

import { exp as EEUniverse } from './EEUniverse.js'

const top = document.querySelector('#topUi')
const bottom = document.querySelector('#bottomUi')
const roomId = document.getElementById("roomId");
const roomConnect = document.getElementById("roomIdConnect")
const writeConnect = document.getElementById("writeData")

document.querySelectorAll('.ui.bottom>div:nth-child(1)>button').forEach(element => {
  element.onclick = () => {
    document.querySelector('button.selected').classList.remove('selected')
    element.classList.add('selected')
  }
})

if (document.querySelector('button.selected') == null)
  document.querySelector('.ui.bottom>div:nth-child(1)>button:nth-child(1)').classList.add('selected')

const image = new Image()
image.src = './AllBlocks.png'
const ground = new Image()
ground.src = './ground.png'

const constants = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  blocks: [new Map(), new Map()],
  currentId: 10,
  keyboard: new Map(),
  clearBlocks: function () { this.blocks.forEach(map => map.clear()) }
}

window.constants = constants

function findBlock(id) {
  if (blockLayers.bg.some(list => list[1] >= id && list[0] <= id)) return [0, 0];
  if (blockLayers.fg.some(list => list[1] >= id && list[0] <= id)) return [1, 1];
  if (blockLayers.ac.some(list => list[1] >= id && list[0] <= id)) return [1, 2];
  return null;
}

const blockLayers = {
  "bg": [[60, 69], [82, 91], [109, 110]],
  "fg": [[1, 10], [12, 12], [18, 43], [45, 54], [72, 81], [95, 96], [106, 108], [111, 112]],
  "ac": [[0, 0], [11, 11], [13, 17], [44, 44], [55, 59], [70, 71], [92, 94], [97, 105]]
}

const gameCanvas = document.querySelector("body > canvas:nth-child(1)")
const gameCtx = gameCanvas.getContext("2d");
const miniMapCanvas = document.querySelector("body > canvas:nth-child(2)")
const miniMapCtx = miniMapCanvas.getContext("2d");

let lastTime = 0;
let token;
let connectionServer;
let place = false;

function main(currentTime) {
  requestAnimationFrame(main)
  if (lastTime > currentTime) lastTime = currentTime
  lastTime = currentTime
  draw()
  placeBlocks()
  moveScreen()
}

main()

function moveScreen() {
  const speed = 0.4
  const left = ck("has", 37) || ck("has", 65)
  const right = ck("has", 39) || ck("has", 68)
  const down = ck("has", 38) || ck("has", 87)
  const up = ck("has", 40) || ck("has", 83)
  if (down ^ up) {
    if (down) {
      constants.y -= speed
    } else {
      constants.y += speed
    }
  }
  if (left ^ right) {
    if (left) {
      constants.x -= speed
    } else {
      constants.x += speed
    }
  }
}

function checkDraw(x, y) {
  if (x + 24 < 0 || y + 24 < 0) return false
  if (x - 24 > gameCanvas.width || y - 24 > gameCanvas.height) return false
  return true
}

function draw() {
  if (gameCanvas.height !== window.innerHeight) gameCanvas.height = window.innerHeight
  if (gameCanvas.width !== window.innerWidth) gameCanvas.width = window.innerWidth
  if (miniMapCanvas.height !== constants.height * 2) miniMapCanvas.height = constants.height * 2
  if (miniMapCanvas.width !== constants.width * 2) miniMapCanvas.width = constants.width * 2

  clear()
  drawBackground()
  drawBlocks()
}

function clear() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
}

function drawBackground() {
  for (let i = 0; i < constants.width; i++) {
    if ((i - constants.x) * 24 - 24 > gameCanvas.width) break;
    for (let j = 0; j < constants.height; j++) {
      if ((j - constants.y) * 24 - 24 > gameCanvas.height) break;
      if (checkDraw((i - constants.x) * 24, (j - constants.y) * 24))
        gameCtx.drawImage(ground, (i - constants.x) * 24, (j - constants.y) * 24, 24, 24)
    }
  }
}

function drawBlocks() {
  for (const [key, value] of constants.blocks[0]) {
    drawBlock(value.id, ...key.split(","))
    drawMiniMap(value.id, ...key.split(","))
  }

  for (const [key, value] of constants.blocks[1]) {
    drawBlock(value.id, ...key.split(","))
    drawMiniMap(value.id, ...key.split(","))
  }
}

function drawBlock(id, x, y) {
  if (checkDraw((x - constants.x) * 24, (y - constants.y) * 24))
    gameCtx.drawImage(image, (id & 15) * 25, Math.floor(id / 16) * 25, 24, 24, (x - constants.x) * 24, (y - constants.y) * 24, 24, 24)
}

function drawMiniMap(id, x, y) {
  if (mapColor.get(id) == -1) return
  miniMapCtx.beginPath()
  miniMapCtx.rect(x * 2, y * 2, 2, 2)
  if (mapColor.get(id) == -2) miniMapCtx.fillStyle = "#000000"
  else miniMapCtx.fillStyle = "#" + mapColor.get(id).toString(16)
  miniMapCtx.fill()
}

function placeBlocks() {
  if (!ck("has", "mouse")) return
  const x = Math.floor(ck("get", "mouse").X / 24 + constants.x)
  const y = Math.floor(ck("get", "mouse").Y / 24 + constants.y)
  if (x >= constants.width || y >= constants.height) return
  if (x < 0 || y < 0) return
  const key = `${x},${y}`
  const layer = findBlock(constants.currentId)[0]
  constants.blocks[layer].set(key, new Block(constants.currentId))
  if (ck("has", 16)) {
    if (constants.blocks[1].has(key)) constants.blocks[1].delete(key)
    else if (constants.blocks[0].has(key)) constants.blocks[0].delete(key)
  }
}

function ck(mode, key, value = "") {
  return constants.keyboard[mode](key, value)
}

function mouseMove(e) {
  e.preventDefault();
  if (!e.composedPath().includes(gameCanvas)) return
  ck("set", "mouse", { X: e.clientX, Y: e.clientY });
}

window.addEventListener("mousedown", e => {
  if (e.composedPath().indexOf(top) == -1) mouseMove(e)
})
window.addEventListener("mousemove", e => {
  if (!ck("has", "mouse")) return
  mouseMove(e)
})
window.addEventListener("keydown", e => {
  if (e.composedPath().indexOf(top) == -1) {
    ck("set", e.keyCode, true)
  }
})
window.addEventListener("keyup", e => {
  if (e.composedPath().indexOf(top) == -1) ck("delete", e.keyCode)
})

window.addEventListener("mouseup", e => {
  ck("delete", "mouse")
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
        ck("set", value[0], true);
      } else {
        ck("delete", value[0]);
      }
    }
  }
})

roomConnect.onclick = () => {
  console.log(connectionServer, roomId.innerText)
  if (connectionServer !== undefined) {
    place = false;
    connectionServer.joinRoom(roomId.innerText);
    connectionServer.send(EEUniverse.MessageType.Init, 0);
  }
}

writeConnect.onclick = () => {
  console.log(connectionServer, roomId.innerText)
  if (connectionServer !== undefined) {
    place = true;
    connectionServer.joinRoom(roomId.innerText);
    connectionServer.send(EEUniverse.MessageType.Init, 0);
  }
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
  constants.clearBlocks()
  constants.width = initMessage.get(9)
  constants.height = initMessage.get(10)
  let index = 0;
  for (let y = 0; y < constants.height; y++) {
    for (let x = 0; x < constants.width; x++) {
      let blocks = initMessage.get(11 + index);
      if (blocks === false) blocks = 0;
      let foreground = EEUniverse.getFgId(blocks);
      let background = EEUniverse.getBgId(blocks);
      let argumentList = [];// not yet used
      index++
      let maxArguments = args.get(foreground).length
      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }
      const bg = new Block(background) //this way both fgs and bgs can have arguments. for later implementation though
      const fg = new Block(foreground, ...argumentList);
      if (bg.id !== 0) {
        constants.blocks[0].set(`${x},${y}`, bg)
      }
      if (fg.id !== 0) {
        constants.blocks[1].set(`${x},${y}`, fg)
      }
    }
  }
  console.log(constants.blocks[0])
  console.log(constants.blocks[1])
}

function CheckDifference(initMessage) {
  let width = initMessage.get(9)
  let heigth = initMessage.get(10)
  let index = 0
  for (let y = 0; y < heigth; y++) {
    for (let x = 0; x < width; x++) {
      let blocks = initMessage.get(11 + index);
      if (blocks === false) blocks = 0;
      let foreground = EEUniverse.getFgId(blocks);
      let background = EEUniverse.getBgId(blocks);
      let argumentList = [];
      index++
      let maxArguments = args.get(foreground).length
      for (let i = 0; i < maxArguments; i++) {
        argumentList.push(initMessage.get(11 + index++));
      }
      const bg = new Block(background);
      const fg = new Block(foreground, ...argumentList);
      if (!bg.equals(constants.blocks[0].get(`${x},${y}`))) {
        bot.send(EEUniverse.MessageType.PlaceBlock, 0, x, y, bg.id, ...bg.args);
      }
      if (!fg.equals(constants.blocks[1].get(`${x},${y}`))) {
        bot.send(EEUniverse.MessageType.PlaceBlock, 1, x, y, fg.id, ...fg.args);
      }
    }
  }
  console.log(constants.blocks[0])
  console.log(constants.blocks[1])
}