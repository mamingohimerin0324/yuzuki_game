const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const hpFill = document.getElementById("hpFill");

const bossContainer = document.getElementById("bossContainer");
const bossFill = document.getElementById("bossFill");

const rankingList = document.getElementById("rankingList");

const gameOverScreen = document.getElementById("gameOver");
const clearScreen = document.getElementById("clearScreen");

const finalScore = document.getElementById("finalScore");
const clearScore = document.getElementById("clearScore");

const restartBtn = document.getElementById("restartBtn");
const clearRestartBtn = document.getElementById("clearRestartBtn");

const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const highScore = document.getElementById("highScore");

const shockwaves = [];

/* ==========================
   CANVAS
========================== */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

function initStars() {
    stars.length = 0;
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 3 + 1
        });
    }
}

window.addEventListener("resize", () => {
    resizeCanvas();
    player.x = 80;
    player.y = Math.min(player.y, canvas.height - player.height);
    initStars();
});

/* ==========================
   AUDIO
========================== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmOsc1 = null;
let bgmOsc2 = null;
let bgmGain = null;
let bossOsc1 = null;
let bossOsc2 = null;
let bossGain = null;
let bgmInterval = null;
let bossInterval = null;

function playSound(freq, duration = 0.08) {
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    if (audioCtx.state !== "running") return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.value = freq;
    gain.gain.value = 0.08;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(
        0.00001,
        audioCtx.currentTime + duration
    );
    osc.stop(audioCtx.currentTime + duration);
}

function startBGM() {
    if (bgmOsc1) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    bgmOsc1 = audioCtx.createOscillator();
    bgmOsc2 = audioCtx.createOscillator();
    bgmGain = audioCtx.createGain();

    bgmOsc1.type = "sawtooth";
    bgmOsc2.type = "triangle";

    bgmOsc1.frequency.value = 110;
    bgmOsc2.frequency.value = 220;
    bgmGain.gain.value = 0.02;

    bgmOsc1.connect(bgmGain);
    bgmOsc2.connect(bgmGain);
    bgmGain.connect(audioCtx.destination);

    bgmOsc1.start();
    bgmOsc2.start();

    let step = 0;
    const melody = [110, 139, 165, 220, 165, 139, 185, 247];

    bgmInterval = setInterval(() => {
        if (!gameRunning) {
            stopBGM();
            return;
        }

        const note = melody[step % melody.length];
        bgmOsc1.frequency.setValueAtTime(note, audioCtx.currentTime);
        bgmOsc2.frequency.setValueAtTime(note * 2, audioCtx.currentTime);
        step++;
    }, 300);
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }

    if (!bgmOsc1) return;

    try {
        bgmOsc1.stop();
        bgmOsc2.stop();
    } catch (e) {}
    bgmOsc1 = null;
    bgmOsc2 = null;
    bgmGain = null;
}

function startBossBGM() {
    if (bossOsc1) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    bossOsc1 = audioCtx.createOscillator();
    bossOsc2 = audioCtx.createOscillator();
    bossGain = audioCtx.createGain();

    bossOsc1.type = "sawtooth";
    bossOsc2.type = "square";
    bossGain.gain.value = 0.03;

    bossOsc1.connect(bossGain);
    bossOsc2.connect(bossGain);
    bossGain.connect(audioCtx.destination);

    bossOsc1.start();
    bossOsc2.start();

    let step = 0;
    const melody = [82, 98, 110, 82, 147, 110, 98, 73];

    bossInterval = setInterval(() => {
        if (!boss || !gameRunning) {
            stopBossBGM();
            return;
        }

        const note = melody[step % melody.length];
        bossOsc1.frequency.setValueAtTime(note, audioCtx.currentTime);
        bossOsc2.frequency.setValueAtTime(note * 2, audioCtx.currentTime);
        step++;
    }, 220);
}

function stopBossBGM() {
    if (bossInterval) {
        clearInterval(bossInterval);
        bossInterval = null;
    }

    if (!bossOsc1) return;

    try {
        bossOsc1.stop();
        bossOsc2.stop();
    } catch (e) {}
    bossOsc1 = null;
    bossOsc2 = null;
    bossGain = null;
}

/* ==========================
   ASSETS
========================== */
const images = {};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function loadAssets() {
    images.player = await loadImage("assets/svg/player.svg");
    images.enemy = await loadImage("assets/svg/enemy.svg");
    images.boss = await loadImage("assets/svg/boss.svg");
    images.bullet = await loadImage("assets/svg/bullet.svg");
}

function loadHighScore() {
    const ranking = JSON.parse(localStorage.getItem("shootingRanking")) || [];
    highScore.textContent = ranking[0] || 0;
}

/* ==========================
   PLAYER & VARIABLES
========================== */
const player = {
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    speed: 8,
    hp: 100,
    maxHp: 100
};

function resetPlayer() {
    player.x = 80;
    player.y = canvas.height / 2 - 30;
}

resetPlayer();

let score = 0;
let gameRunning = false;
let isSpawningBoss = false;

let boss = null;
let bossSpawned = false;
let bossAttackInterval = null;

let shakePower = 0;
let shakeTime = 0;

const bullets = [];
const enemies = [];
const enemyBullets = [];
const explosions = [];
const stars = [];

initStars();

function clearBossTimer() {
    if (bossAttackInterval) {
        clearInterval(bossAttackInterval);
        bossAttackInterval = null;
    }
}

startBtn.addEventListener("click", () => {
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    titleScreen.classList.add("hidden");

    player.hp = player.maxHp;
    score = 0;
    scoreEl.textContent = score;
    hpFill.style.width = "100%";

    boss = null;
    bossSpawned = false;
    isSpawningBoss = false;

    clearBossTimer();

    bullets.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
    explosions.length = 0;
    shockwaves.length = 0;

    bossContainer.classList.add("hidden");
    bossFill.style.width = "100%";

    gameOverScreen.classList.add("hidden");
    clearScreen.classList.add("hidden");

    resetPlayer();
    stopBGM();
    stopBossBGM();
    gameRunning = true;

    startBGM();
});

/* ==========================
   SHAKE & EXPLOSION（iPad負荷軽減版）
========================== */
const MAX_EXPLOSIONS = 160;

function startShake(power, duration) {
    shakePower = Math.max(shakePower, power);
    shakeTime = Math.max(shakeTime, duration);
}

function createExplosion(x, y, color = "#ff9900", count = 16) {
    for (let i = 0; i < count; i++) {
        if (explosions.length >= MAX_EXPLOSIONS) {
            explosions.shift();
        }
        explosions.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            size: Math.random() * 8 + 4,
            life: 26,
            color
        });
    }
}

/* ==========================
   INPUT
========================== */
const keys = {
    up: false,
    down: false
};

window.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "ArrowDown") keys.down = true;
    if (e.code === "Space") shoot();
});

window.addEventListener("keyup", e => {
    if (e.key === "ArrowUp") keys.up = false;
    if (e.key === "ArrowDown") keys.down = false;
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        keys.up = false;
        keys.down = false;
    }
});

document.getElementById("fireBtn")?.addEventListener("touchstart", e => {
    e.preventDefault();
    shoot();
}, { passive: false });

canvas.addEventListener("click", shoot);

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");

upBtn?.addEventListener("touchstart", e => {
    e.preventDefault();
    keys.up = true;
}, { passive: false });
upBtn?.addEventListener("touchend", () => {
    keys.up = false;
});
upBtn?.addEventListener("touchcancel", () => {
    keys.up = false;
});

downBtn?.addEventListener("touchstart", e => {
    e.preventDefault();
    keys.down = true;
}, { passive: false });
downBtn?.addEventListener("touchend", () => {
    keys.down = false;
});
downBtn?.addEventListener("touchcancel", () => {
    keys.down = false;
});

/* ==========================
   SHOOT & ENEMY
========================== */
function shoot() {
    if (!gameRunning) return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 6,
        width: 20,
        height: 12,
        speed: 12
    });

    playSound(800, 0.05);
}

function spawnEnemy() {
    if (!gameRunning || bossSpawned || isSpawningBoss) return;

    enemies.push({
        x: canvas.width + 60,
        y: Math.random() * Math.max(10, canvas.height - 50),
        width: 50,
        height: 50,
        speed: 2
    });
}

setInterval(spawnEnemy, 1000);

/* ==========================
   BOSS（WARNING〜出現を軽量化）
========================== */
async function spawnBoss() {
    if (bossSpawned || isSpawningBoss || !gameRunning) return;
    isSpawningBoss = true;

    const warning = document.getElementById("warning");
    warning?.classList.remove("hidden");

    enemies.length = 0;
    enemyBullets.length = 0;
    clearBossTimer();
    gameRunning = false;

    await new Promise(resolve => setTimeout(resolve, 2000));

    warning?.classList.add("hidden");

    if (!isSpawningBoss || player.hp <= 0) {
        isSpawningBoss = false;
        return;
    }

    bossSpawned = true;
    isSpawningBoss = false;

    bossContainer.classList.remove("hidden");
    bossFill.style.width = "100%";

    boss = {
        x: Math.max(80, canvas.width - 280),
        y: Math.max(0, canvas.height / 2 - 100),
        width: 240,
        height: 200,
        hp: 150,
        maxHp: 150,
        speed: 3,
        dir: 1
    };

    for (let i = 0; i < 12; i++) {
        createExplosion(
            boss.x + Math.random() * boss.width * 0.6,
            boss.y + Math.random() * boss.height * 0.6,
            "#ff3300",
            12
        );
    }

    startShake(18, 35);
    playSound(80, 0.25);

    gameRunning = true;
    stopBGM();
    startBossBGM();

    bossAttackInterval = setInterval(() => {
        if (!boss || !gameRunning) return;

        for (let i = -2; i <= 2; i++) {
            enemyBullets.push({
                x: boss.x,
                y: boss.y + boss.height / 2,
                width: 14,
                height: 14,
                dx: -6,
                dy: i * 1.5
            });
        }
    }, 1000);
}

/* ==========================
   COLLISION & RANKING
========================== */
function hit(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function loadRanking() {
    const ranking = JSON.parse(localStorage.getItem("shootingRanking")) || [];
    rankingList.innerHTML = "";

    ranking.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        rankingList.appendChild(li);
    });
}

function saveRanking() {
    let ranking = JSON.parse(localStorage.getItem("shootingRanking")) || [];
    ranking.push(score);
    ranking.sort((a, b) => b - a);
    ranking = ranking.slice(0, 5);
    localStorage.setItem("shootingRanking", JSON.stringify(ranking));
}

/* ==========================
   GAME EVENTS
========================== */
function gameOver() {
    stopBGM();
    stopBossBGM();
    clearBossTimer();
    isSpawningBoss = false;
    gameRunning = false;

    for (let i = 0; i < 20; i++) {
        createExplosion(
            player.x + player.width / 2,
            player.y + player.height / 2,
            "#00ffff",
            10
        );
    }

    startShake(20, 40);

    saveRanking();
    loadRanking();
    loadHighScore();
    finalScore.textContent = "SCORE : " + score;
    gameOverScreen.classList.remove("hidden");
}

function gameClear() {
    stopBGM();
    stopBossBGM();
    clearBossTimer();
    isSpawningBoss = false;
    gameRunning = false;

    saveRanking();
    loadRanking();
    loadHighScore();
    clearScore.textContent = "SCORE : " + score;
    clearScreen.classList.remove("hidden");
}

/* ==========================
   UPDATE
========================== */
function update() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += 6;
        s.alpha -= 0.04;
        if (s.alpha <= 0) {
            shockwaves.splice(i, 1);
        }
    }

    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < -10) {
            star.x = canvas.width + 10;
            star.y = Math.random() * canvas.height;
        }
    });

    for (let i = explosions.length - 1; i >= 0; i--) {
        const p = explosions[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        p.size *= 0.95;
        if (p.life <= 0) {
            explosions.splice(i, 1);
        }
    }

    if (shakeTime > 0) {
        shakeTime--;
        shakePower *= 0.92;
        if (shakePower < 0.1) {
            shakePower = 0;
        }
    }

    if (!gameRunning) return;

    if (keys.up) player.y -= player.speed;
    if (keys.down) player.y += player.speed;

    player.y = Math.max(
        0,
        Math.min(canvas.height - player.height, player.y)
    );

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].speed;
        if (bullets[i].x > canvas.width + 50) {
            bullets.splice(i, 1);
        }
    }

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        e.x -= e.speed;

        if (e.x < -100) {
            enemies.splice(ei, 1);
            continue;
        }

        let enemyDestroyed = false;
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            if (hit(e, bullets[bi])) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                enemyDestroyed = true;

                score += 100;
                createExplosion(e.x + e.width / 2, e.y + e.height / 2);
                startShake(3, 8);
                playSound(300, 0.06);

                if (score >= 2000 && !bossSpawned) {
                    spawnBoss();
                }
                break;
            }
        }

        if (enemyDestroyed) continue;

        if (hit(e, player)) {
            enemies.splice(ei, 1);
            player.hp -= 20;
            createExplosion(
                player.x + player.width / 2,
                player.y + player.height / 2,
                "#00ffff"
            );
            startShake(10, 15);
            playSound(100, 0.15);
        }
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.dx;
        b.y += b.dy;

        if (
            b.x < -50 ||
            b.x > canvas.width + 50 ||
            b.y < -50 ||
            b.y > canvas.height + 50
        ) {
            enemyBullets.splice(i, 1);
            continue;
        }

        let bulletCleared = false;
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            if (hit(b, bullets[bi])) {
                enemyBullets.splice(i, 1);
                bullets.splice(bi, 1);
                bulletCleared = true;

                shockwaves.push({
                    x: b.x,
                    y: b.y,
                    radius: 5,
                    alpha: 1
                });
                score += 10;

                createExplosion(b.x, b.y, "#ffff00", 14);
                createExplosion(b.x, b.y, "#ffffff", 8);

                startShake(6, 10);
                playSound(900, 0.03);
                break;
            }
        }

        if (bulletCleared) continue;

        if (hit(b, player)) {
            enemyBullets.splice(i, 1);
            player.hp -= 10;
            createExplosion(
                player.x + player.width / 2,
                player.y + player.height / 2,
                "#00ffff"
            );
            startShake(8, 12);
            playSound(150, 0.15);
        }
    }

    if (boss) {
        boss.y += boss.speed * boss.dir;
        if (boss.y < 0 || boss.y + boss.height > canvas.height) {
            boss.dir *= -1;
        }

        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            if (hit(bullets[bi], boss)) {
                bullets.splice(bi, 1);
                boss.hp--;
                startShake(2, 4);

                if (boss.hp <= 0) {
                    for (let k = 0; k < 15; k++) {
                        createExplosion(
                            boss.x + Math.random() * boss.width,
                            boss.y + Math.random() * boss.height,
                            "#ff2200",
                            12
                        );
                    }
                    startShake(22, 45);
                    score += 2000;
                    boss = null;
                    bossContainer.classList.add("hidden");
                    stopBossBGM();
                    gameClear();
                    break;
                }
            }
        }

        if (boss) {
            bossFill.style.width = (boss.hp / boss.maxHp) * 100 + "%";
        }
    }

    hpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + "%";
    scoreEl.textContent = score;

    if (player.hp <= 0) {
        gameOver();
    }
}

/* ==========================
   DRAW
========================== */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.4 + star.speed / 4;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();

    if (shakeTime > 0) {
        ctx.translate(
            (Math.random() - 0.5) * shakePower,
            (Math.random() - 0.5) * shakePower
        );
    }

    if (images.player) {
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    }

    enemies.forEach(e => {
        if (images.enemy) {
            ctx.drawImage(images.enemy, e.x, e.y, e.width, e.height);
        }
    });

    bullets.forEach(b => {
        if (images.bullet) {
            ctx.drawImage(images.bullet, b.x, b.y, b.width, b.height);
        }
    });

    ctx.fillStyle = "#ff00ff";
    enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
        ctx.fill();
    });

    if (boss && images.boss) {
        ctx.drawImage(images.boss, boss.x, boss.y, boss.width, boss.height);
    }

    explosions.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    shockwaves.forEach(s => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.strokeStyle = "#ffff88";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });

    ctx.restore();
}

/* ==========================
   LOOP & RESTART
========================== */
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

restartBtn?.addEventListener("click", () => location.reload());
clearRestartBtn?.addEventListener("click", () => location.reload());

async function startGame() {
    bossContainer.classList.add("hidden");
    bossFill.style.width = "100%";
    gameOverScreen.classList.add("hidden");
    clearScreen.classList.add("hidden");

    try {
        await loadAssets();
        loadRanking();
        loadHighScore();
        loop();
    } catch (err) {
        console.error("SVG読込エラー", err);
        alert("assets/svg フォルダと SVG ファイルを確認してください");
    }
}

startGame();
