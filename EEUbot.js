import { mapColor } from './mapcolor.js'
import { args } from './arguments.js'
console.log(mapColor, args)

const top = document.querySelector('#topUi')
const bottom = document.querySelector('#bottomUi')

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
  keyboard: new Map()
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
      if ((i - constants.x) * 24 + 24 < 0) break;
      if (checkDraw((i - constants.x) * 24, (j - constants.y) * 24))
        gameCtx.drawImage(ground, (i - constants.x) * 24, (j - constants.y) * 24, 24, 24)
    }
  }
}

function drawBlocks() {
  for (const [key, id] of constants.blocks[0]) {
    drawBlock(id, ...key.split(","))
    drawMiniMap(id, ...key.split(","))
  }

  for (const [key, id] of constants.blocks[1]) {
    drawBlock(id, ...key.split(","))
    drawMiniMap(id, ...key.split(","))
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
  if (ck("get", "oldMouse") === undefined)
    ck("set", "oldMouse", ck("get", "mouse"))
  const oldX = Math.floor(ck("get", "oldMouse").X / 24 + constants.x)
  const oldY = Math.floor(ck("get", "oldMouse").Y / 24 + constants.y)
  const newX = Math.floor(ck("get", "mouse").X / 24 + constants.x)
  const newY = Math.floor(ck("get", "mouse").Y / 24 + constants.y)
  if (newX >= constants.width || newY >= constants.height) return
  if (newX < 0 || newY < 0) return
  const distance2 = ((ck("get", "oldMouse").X - ck("get", "mouse").X) ** 2 +
    (ck("get", "oldMouse").Y - ck("get", "mouse").Y) ** 2) ** (1 / 2)
  const dist = "XY".split("").map(letter => "oldMouse,mouse".split(",").map(pos => ck("get", pos)[letter])
    .reduce((a, b) => (a - b) ** 2)).reduce((a, b) => (a + b) ** (1 / 2))
  console.log(dist / 24)
  const distance = ((oldX - newX) ** 2 + (oldY - newY) ** 2) ** (1 / 2)
  const angle = Math.atan2(oldY - newY, oldX - newX)
  console.log(distance, distance2 / 24, angle / Math.PI * 180)
  const key = `${newX},${newY}`
  const layer = findBlock(constants.currentId)[0]
  constants.blocks[layer].set(key, constants.currentId)
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
  ck("set", "oldMouse", ck("get", "mouse"))
  ck("set", "mouse", { X: e.clientX, Y: e.clientY });
}

window.addEventListener("mousedown", mouseMove)
window.addEventListener("mousemove", e => {
  if (!ck("has", "mouse")) return
  mouseMove(e)
})
window.addEventListener("keydown", e => {
  if (e.keyCode == 66) bottom.classList.toggle("min")
  ck("set", e.keyCode, true)
})

window.addEventListener("keyup", e => {
  ck("delete", e.keyCode)
})

window.addEventListener("mouseup", e => {
  ck("delete", "mouse")
})

window.addEventListener("message", event => {
  if (event.origin !== "https://ee-universe.com/game/index.html" && event.origin !== "https://ee-universe.com") return
  console.log(event)
  if (typeof event.data == "string") {
    miniMapCanvas.width += 10
    const value = JSON.parse(event.data)
    if (value[1]) {
      if (value[0] == 66) bottom.classList.toggle("min")
      ck("set", value[0], true)
    } else {
      ck("delete", value[0])
    }
  }
})