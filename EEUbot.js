import { mapColor } from './mapcolor.js'
import { args } from './arguments.js'
console.log(mapColor, args)

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
  if (blockLayers.bg.some(list => list[1] >= id && list[0] <= id)) return 0;
  if (blockLayers.fg.some(list => list[1] >= id && list[0] <= id)) return 1;
  if (blockLayers.ac.some(list => list[1] >= id && list[0] <= id)) return 1;
  return null;
}

const blockLayers = {
  "bg": [[60, 69], [82, 91], [109, 110]],
  "fg": [[1, 10], [12, 12], [18, 43], [45, 54], [72, 81], [95, 96], [106, 108], [111, 112]],
  "ac": [[0, 0], [11, 11], [13, 17], [44, 44], [55, 59], [70, 71], [92, 94], [97, 105]]
}

const gameCanvas = document.querySelector("body > canvas:nth-child(1)")
const gameCtx = gameCanvas.getContext("2d");

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
  const left = constants.keyboard.has(37) || constants.keyboard.has(65)
  const right = constants.keyboard.has(39) || constants.keyboard.has(68)
  const down = constants.keyboard.has(38) || constants.keyboard.has(87)
  const up = constants.keyboard.has(40) || constants.keyboard.has(83)
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

  clear()
  drawBackground()
  drawBlocks()
}

function clear() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
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
  }

  for (const [key, id] of constants.blocks[1]) {
    drawBlock(id, ...key.split(","))
  }
}

function drawBlock(id, x, y) {
  if (checkDraw((x - constants.x) * 24, (y - constants.y) * 24))
    gameCtx.drawImage(image, (id & 15) * 24, Math.floor(id / 16) * 24, 24, 24, (x - constants.x) * 24, (y - constants.y) * 24, 24, 24)
}

function placeBlocks() {
  if (!constants.keyboard.has("mouse")) return
  const x = Math.floor(constants.keyboard.get("mouse").X / 24 + constants.x)
  const y = Math.floor(constants.keyboard.get("mouse").Y / 24 + constants.y)
  if (x >= constants.width || y >= constants.height) return
  if (x < 0 || y < 0) return
  const key = `${x},${y}`
  const layer = findBlock(constants.currentId)
  constants.blocks[layer].set(key, constants.currentId)
  if (constants.keyboard.has(16)) {
    if (constants.blocks[1].has(key)) constants.blocks[1].delete(key)
    else if (constants.blocks[0].has(key)) constants.blocks[0].delete(key)
  }
}

function mouseMove(e) {
  e.preventDefault();
  if (!e.composedPath().includes(gameCanvas)) return
  constants.keyboard.set("mouse", { X: e.clientX, Y: e.clientY });
}

window.addEventListener("mousedown", mouseMove)
window.addEventListener("mousemove", e => {
  if (!constants.keyboard.has("mouse")) return
  mouseMove(e)
})
window.addEventListener("keydown", e => {
  constants.keyboard.set(e.keyCode, true)
})

window.addEventListener("keyup", e => {
  constants.keyboard.delete(e.keyCode)
})

window.addEventListener("mouseup", e => {
  constants.keyboard.delete("mouse");
})