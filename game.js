const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const bestScoreEl = document.getElementById("bestScore");
const finalScoreEl = document.getElementById("finalScore");
const finalBestScoreEl = document.getElementById("finalBestScore");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 118;
const PIPE_SPAWN_MS = 1480;
const OBSTACLE_HEAD_HEIGHT = 106;
const OBSTACLE_SHAFT_WIDTH = 18;
const OBSTACLE_SHAFT_OVERLAP = 12;

const art = {
  sausage: loadImage("assets/sausage.svg"),
  bean: loadImage("assets/bean.svg"),
  mushroom: loadImage("assets/mushroom.svg"),
  fork: loadImage("assets/fork.svg"),
};

const skyDrifters = Array.from({ length: 13 }, (_, index) => createSkyDrifter(index));

const game = {
  state: "ready",
  lastTime: 0,
  spawnTimer: 0,
  score: 0,
  bestScore: Number(localStorage.getItem("flappy-sausage-best") || 0),
  bird: createBird(),
  obstacles: [],
};

bestScoreEl.textContent = String(game.bestScore);
drawScene(0);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
window.addEventListener("keydown", handleKeyDown);
canvas.addEventListener("pointerdown", handlePrimaryInput);

requestAnimationFrame(loop);

function createBird() {
  return {
    x: 122,
    y: HEIGHT / 2 - 40,
    width: 92,
    height: 50,
    velocity: 0,
    rotation: 0,
  };
}

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function createSkyDrifter(index) {
  const type = index % 4 === 0 ? "mushroom" : "bean";
  const isMushroom = type === "mushroom";

  return {
    type,
    x: (index * 84) % (WIDTH + 120),
    y: 54 + (index % 5) * 86 + (isMushroom ? 14 : 0),
    size: isMushroom ? 44 + (index % 3) * 9 : 38 + (index % 4) * 10,
    drift: isMushroom ? 10 + (index % 2) * 5 : 13 + (index % 3) * 5,
    sway: Math.random() * Math.PI * 2,
  };
}

function handleKeyDown(event) {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    handlePrimaryInput();
  }

  if (event.code === "KeyR" && game.state === "gameover") {
    restartGame();
  }
}

function handlePrimaryInput() {
  if (game.state === "ready") {
    startGame();
    return;
  }

  if (game.state !== "playing") {
    return;
  }

  flap();
}

function startGame() {
  startOverlay.classList.remove("overlay-visible");

  if (game.state === "gameover") {
    resetGame();
  }

  game.state = "playing";
  flap();
}

function restartGame() {
  gameOverOverlay.classList.remove("overlay-visible");
  resetGame();
  game.state = "playing";
  flap();
}

function resetGame() {
  game.score = 0;
  game.spawnTimer = 0;
  game.obstacles = [];
  game.bird = createBird();
}

function flap() {
  game.bird.velocity = -380;
}

function loop(timestamp) {
  if (!game.lastTime) {
    game.lastTime = timestamp;
  }

  const deltaMs = Math.min(timestamp - game.lastTime, 32);
  const deltaSeconds = deltaMs / 1000;
  game.lastTime = timestamp;

  update(deltaSeconds, deltaMs, timestamp / 1000);
  drawScene(timestamp / 1000);
  requestAnimationFrame(loop);
}

function update(deltaSeconds, deltaMs, timeSeconds) {
  updateSkyDrifters(deltaSeconds, timeSeconds);

  if (game.state !== "playing") {
    if (game.state === "ready") {
      floatBird(timeSeconds);
    }
    return;
  }

  updateBird(deltaSeconds);
  updateObstacles(deltaSeconds, deltaMs);
  detectCollisions();
}

function updateSkyDrifters(deltaSeconds, timeSeconds) {
  for (const drifter of skyDrifters) {
    drifter.x -= drifter.drift * deltaSeconds;
    drifter.y += Math.sin(timeSeconds * 0.8 + drifter.sway) * 0.18;

    if (drifter.x < -drifter.size * 1.8) {
      drifter.x = WIDTH + drifter.size + Math.random() * 90;
      drifter.y = 48 + Math.random() * (HEIGHT - GROUND_HEIGHT - 240);
      drifter.sway = Math.random() * Math.PI * 2;
    }
  }
}

function floatBird(timeSeconds) {
  game.bird.y = HEIGHT / 2 - 40 + Math.sin(timeSeconds * 2.5) * 10;
  game.bird.rotation = Math.sin(timeSeconds * 2.5) * 0.08;
}

function updateBird(deltaSeconds) {
  game.bird.velocity += 930 * deltaSeconds;
  game.bird.y += game.bird.velocity * deltaSeconds;
  game.bird.rotation = clamp(game.bird.velocity / 470, -0.45, 1.08);
}

function updateObstacles(deltaSeconds, deltaMs) {
  game.spawnTimer += deltaMs;

  if (game.spawnTimer >= PIPE_SPAWN_MS) {
    game.spawnTimer = 0;
    spawnObstaclePair();
  }

  for (const obstacle of game.obstacles) {
    obstacle.x -= obstacle.speed * deltaSeconds;

    if (!obstacle.passed && obstacle.x + obstacle.width < game.bird.x) {
      obstacle.passed = true;
      game.score += 1;
      bestScoreEl.textContent = String(Math.max(game.bestScore, game.score));
    }
  }

  game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
}

function spawnObstaclePair() {
  const gap = 168;
  const obstacleWidth = 88;
  const minTop = 120;
  const maxTop = HEIGHT - GROUND_HEIGHT - gap - 140;
  const topHeight = randomBetween(minTop, maxTop);

  game.obstacles.push({
    x: WIDTH + 60,
    width: obstacleWidth,
    topHeight,
    gap,
    speed: 198,
    passed: false,
  });
}

function detectCollisions() {
  const birdHitbox = {
    x: game.bird.x - game.bird.width * 0.29,
    y: game.bird.y - game.bird.height * 0.26,
    width: game.bird.width * 0.58,
    height: game.bird.height * 0.54,
  };

  const floorY = HEIGHT - GROUND_HEIGHT;

  if (birdHitbox.y <= 0 || birdHitbox.y + birdHitbox.height >= floorY) {
    endGame();
    return;
  }

  for (const obstacle of game.obstacles) {
    const hitboxes = [
      ...getObstacleHitboxes(obstacle, true),
      ...getObstacleHitboxes(obstacle, false),
    ];

    if (hitboxes.some((rect) => rectIntersects(birdHitbox, rect))) {
      endGame();
      return;
    }
  }
}

function endGame() {
  game.state = "gameover";
  game.bestScore = Math.max(game.bestScore, game.score);
  localStorage.setItem("flappy-sausage-best", String(game.bestScore));
  bestScoreEl.textContent = String(game.bestScore);
  finalScoreEl.textContent = String(game.score);
  finalBestScoreEl.textContent = String(game.bestScore);
  gameOverOverlay.classList.add("overlay-visible");
}

function rectIntersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawScene(timeSeconds) {
  drawBackground();
  drawSkyDrifters();
  drawKitchenSilhouette(timeSeconds);
  drawObstacles();
  drawCounter();
  drawBird();
  drawForegroundHud();
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#f8eee5";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const patternSize = 46;
  for (let y = 0; y < HEIGHT - GROUND_HEIGHT; y += patternSize) {
    for (let x = 0; x < WIDTH; x += patternSize) {
      ctx.fillStyle = (x / patternSize + y / patternSize) % 2 === 0 ? "#fff8f0" : "#cb3436";
      ctx.fillRect(x, y, patternSize, patternSize);
    }
  }

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  for (let x = -HEIGHT; x < WIDTH + HEIGHT; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + HEIGHT, HEIGHT);
    ctx.stroke();
  }
  for (let x = 0; x < WIDTH + HEIGHT; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - HEIGHT, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyDrifters() {
  for (const drifter of skyDrifters) {
    const bob = Math.sin(drifter.sway + drifter.x * 0.01) * 6;
    const isMushroom = drifter.type === "mushroom";
    const width = isMushroom ? drifter.size * 1.08 : drifter.size * 1.3;
    const height = isMushroom ? drifter.size : drifter.size;
    drawImageOrFallback(art[drifter.type], drifter.x, drifter.y + bob, width, height);
  }
}

function drawKitchenSilhouette(timeSeconds) {
  ctx.save();
  ctx.fillStyle = "rgba(111, 34, 27, 0.16)";
  const baseY = HEIGHT - GROUND_HEIGHT - 36;

  for (let i = 0; i < 8; i += 1) {
    const x = i * 62;
    const wobble = Math.sin(timeSeconds * 0.45 + i) * 6;
    const height = 90 + (i % 4) * 28 + wobble;
    ctx.fillRect(x, baseY - height, 34, height);
    ctx.fillRect(x + 12, baseY - height - 24, 10, 18);
  }

  ctx.restore();
}

function drawObstacles() {
  for (const obstacle of game.obstacles) {
    drawObstacleColumn(obstacle, true);
    drawObstacleColumn(obstacle, false);
  }
}

function drawObstacleColumn(obstacle, upsideDown) {
  const layout = getObstacleLayout(obstacle, upsideDown);

  ctx.fillStyle = "#d9e2e8";
  ctx.fillRect(layout.shaft.x, layout.shaft.y, layout.shaft.width, layout.shaft.height);

  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(layout.shaft.x + 4, layout.shaft.y + 10, 4, Math.max(0, layout.shaft.height - 20));

  ctx.save();
  if (upsideDown) {
    ctx.translate(layout.head.x + layout.head.width / 2, layout.head.y + layout.head.height / 2);
    ctx.scale(1, -1);
    ctx.translate(-(layout.head.x + layout.head.width / 2), -(layout.head.y + layout.head.height / 2));
  }
  drawImageOrFallback(art.fork, layout.head.x, layout.head.y, layout.head.width, layout.head.height);
  ctx.restore();
}

function getObstacleLayout(obstacle, upsideDown) {
  const y = upsideDown ? 0 : obstacle.topHeight + obstacle.gap;
  const height = upsideDown ? obstacle.topHeight : HEIGHT - GROUND_HEIGHT - y;
  const headHeight = Math.min(OBSTACLE_HEAD_HEIGHT, height);
  const headY = upsideDown ? y + height - headHeight : y;
  const shaftHeight = Math.max(0, height - headHeight + OBSTACLE_SHAFT_OVERLAP);
  const shaftY = upsideDown ? y : headY + headHeight - OBSTACLE_SHAFT_OVERLAP;

  return {
    head: {
      x: obstacle.x - 10,
      y: headY,
      width: obstacle.width + 20,
      height: headHeight,
    },
    shaft: {
      x: obstacle.x + obstacle.width / 2 - OBSTACLE_SHAFT_WIDTH / 2,
      y: shaftY,
      width: OBSTACLE_SHAFT_WIDTH,
      height: shaftHeight,
    },
  };
}

function getObstacleHitboxes(obstacle, upsideDown) {
  const layout = getObstacleLayout(obstacle, upsideDown);
  const tineHeight = Math.min(48, Math.max(18, layout.head.height - 34));
  const tineY = upsideDown
    ? layout.head.y + layout.head.height - tineHeight - 4
    : layout.head.y + 4;
  const tineWidth = 8;
  const tineXs = [layout.head.x + 17, layout.head.x + 37, layout.head.x + 57, layout.head.x + 77];
  const shoulderY = upsideDown ? layout.head.y + 6 : layout.head.y + 42;

  return [
    {
      x: layout.shaft.x - 1,
      y: layout.shaft.y,
      width: layout.shaft.width + 2,
      height: layout.shaft.height,
    },
    {
      x: layout.head.x + 33,
      y: shoulderY,
      width: layout.head.width - 66,
      height: Math.max(0, layout.head.height - 36),
    },
    ...tineXs.map((x) => ({
      x,
      y: tineY,
      width: tineWidth,
      height: tineHeight,
    })),
  ].filter((rect) => rect.width > 0 && rect.height > 0);
}

function drawCounter() {
  const top = HEIGHT - GROUND_HEIGHT;

  ctx.fillStyle = "#b26042";
  ctx.fillRect(0, top, WIDTH, GROUND_HEIGHT);

  ctx.fillStyle = "#d28756";
  ctx.fillRect(0, top, WIDTH, 24);

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  for (let x = -30; x < WIDTH + 40; x += 48) {
    ctx.fillRect(x, top + 8, 20, GROUND_HEIGHT - 20);
  }

  ctx.fillStyle = "#875039";
  ctx.fillRect(0, HEIGHT - 18, WIDTH, 18);
}

function drawBird() {
  const { x, y, width, height, rotation } = game.bird;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawImageOrFallback(art.sausage, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawForegroundHud() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(75, 29, 24, 0.15)";
  ctx.font = '800 60px "Baloo 2"';
  ctx.fillText(String(game.score), WIDTH / 2, 90);
  ctx.fillStyle = "#fffaf3";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(122, 36, 29, 0.22)";
  ctx.strokeText(String(game.score), WIDTH / 2, 92);
  ctx.fillStyle = "#fffaf3";
  ctx.fillText(String(game.score), WIDTH / 2, 90);

  if (game.state === "ready") {
    ctx.fillStyle = "rgba(90, 29, 23, 0.65)";
    ctx.font = '700 18px "Nunito"';
    ctx.fillText("Press space or tap to flap", WIDTH / 2, HEIGHT - 154);
  }

  ctx.restore();
}

function drawImageOrFallback(image, x, y, width, height) {
  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, x, y, width, height);
    return;
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillRect(x, y, width, height);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
