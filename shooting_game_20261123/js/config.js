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
const warningEl = document.getElementById("warning");

const items = [];
/* ==========================
   MEMORY CLEANUP
========================== */
function cleanupEffects() {

    bullets.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;

    explosions.length = 0;
    shockwaves.length = 0;

    shakePower = 0;
    shakeTime = 0;
}



/* ==========================
   SHARED STATE & ARRAYS
========================== */
let score = 0;
let gameRunning = false;

let shakePower = 0;
let shakeTime = 0;
const MAX_BULLETS = 40;
const MAX_EXPLOSIONS = 50;
const MAX_SHOCKWAVES = 20;
const bullets = [];
const enemies = [];
const enemyBullets = [];
const explosions = [];
const shockwaves = [];
const stars = [];

/* ==========================
   CANVAS & STARS
========================== */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initStars() {
    stars.length = 0;
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 3 + 1
        });
    }
}

function updateStarsAndEffects() {
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
}

function drawStarsAndEffects() {
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
}

function endShakeTransform() {
    ctx.restore();
}

/* ==========================
   AUDIO（iPad Safari 安定版：ノード使い回し）
========================== */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

let bgmOsc1 = null;
let bgmOsc2 = null;
let bgmGain = null;
let bgmStep = 0;
let bgmTimer = 0;
let bgmMode = "none"; // "none" | "normal" | "boss"

const NORMAL_MELODY = [110, 139, 165, 220, 165, 139, 185, 247];
const BOSS_MELODY = [82, 98, 110, 82, 147, 110, 98, 73];

function unlockAudio() {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => { });
    }
}

function playSound(freq, duration = 0.06) {
    if (!audioCtx || audioCtx.state !== "running") return;

    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + duration);
    } catch (e) { }
}

function ensureBGMNodes() {
    if (!audioCtx || bgmOsc1) return;

    try {
        bgmOsc1 = audioCtx.createOscillator();
        bgmOsc2 = audioCtx.createOscillator();
        bgmGain = audioCtx.createGain();

        bgmOsc1.type = "sawtooth";
        bgmOsc2.type = "triangle";

        bgmOsc1.frequency.value = 110;
        bgmOsc2.frequency.value = 220;
        bgmGain.gain.value = 0;

        bgmOsc1.connect(bgmGain);
        bgmOsc2.connect(bgmGain);
        bgmGain.connect(audioCtx.destination);

        bgmOsc1.start();
        bgmOsc2.start();
    } catch (e) {
        bgmOsc1 = null;
        bgmOsc2 = null;
        bgmGain = null;
    }
}

function setBGMMode(mode) {

    if (bgmMode === mode) {
        return;
    }

    bgmMode = mode;

    bgmStep = 0;
    bgmTimer = 0;

    if (!audioCtx) {
        return;
    }

    if (audioCtx.state !== "running") {
        return;
    }

    ensureBGMNodes();

    if (
        !bgmGain ||
        !bgmOsc1 ||
        !bgmOsc2
    ) {
        return;
    }

    try {

        const now =
            audioCtx.currentTime;

        bgmGain.gain.cancelScheduledValues(
            now
        );

        bgmGain.gain.setValueAtTime(
            bgmGain.gain.value,
            now
        );

        switch (mode) {

            case "none":

                bgmGain.gain.linearRampToValueAtTime(
                    0,
                    now + 0.1
                );

                break;

            case "normal":

                bgmOsc1.type = "sawtooth";
                bgmOsc2.type = "triangle";

                bgmGain.gain.linearRampToValueAtTime(
                    0.02,
                    now + 0.1
                );

                break;

            case "boss":

                bgmOsc1.type = "sawtooth";
                bgmOsc2.type = "square";

                bgmGain.gain.linearRampToValueAtTime(
                    0.025,
                    now + 0.1
                );

                break;
        }

    } catch (err) {

        console.error(
            "BGM MODE ERROR",
            err
        );
    }
}
function updateBGM() {

    if (
        bgmMode === "none" ||
        !audioCtx ||
        audioCtx.state !== "running"
    ) {
        return;
    }

    if (!bgmOsc1 || !bgmOsc2) return;

    bgmTimer++;

    const intervalFrames =
        bgmMode === "boss" ? 20 : 18;

    if (bgmTimer < intervalFrames) return;

    bgmTimer = 0;

    const melody =
        bgmMode === "boss"
            ? BOSS_MELODY
            : NORMAL_MELODY;

    const note =
        melody[bgmStep % melody.length];

    bgmStep++;

    const now = audioCtx.currentTime;

    bgmOsc1.frequency.linearRampToValueAtTime(
        note,
        now + 0.05
    );

    bgmOsc2.frequency.linearRampToValueAtTime(
        note * 2,
        now + 0.05
    );
}
/* ==========================
   ASSETS & EFFECTS & RANKING
========================== */
const images = {};

function loadImageAndCache(src, w, h) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const off = document.createElement("canvas");
                off.width = w;
                off.height = h;
                const offCtx = off.getContext("2d");
                offCtx.drawImage(img, 0, 0, w, h);
                resolve(off);
            } catch (e) {
                resolve(img);
            }
        };
        img.onerror = reject;
        img.src = src;
    });
}

async function loadAssets() {
    images.player = await loadImageAndCache("assets/svg/player.svg", 60, 60);
    images.enemy = await loadImageAndCache("assets/svg/enemy.svg", 50, 50);
    images.boss = await loadImageAndCache("assets/svg/boss.svg", 240, 200);
    images.bullet = await loadImageAndCache("assets/svg/bullet.svg", 20, 12);
}

function startShake(power, duration) {
    shakePower = Math.max(shakePower, power);
    shakeTime = Math.max(shakeTime, duration);
}

function createExplosion(x, y, color = "#ff9900", count = 12) {
    for (let i = 0; i < count; i++) {
        if (explosions.length >= MAX_EXPLOSIONS) {
            explosions.shift();
        }
        explosions.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            size: Math.random() * 7 + 3,
            life: 24,
            color
        });
    }
}

function drawExplosionsAndShockwaves() {
    explosions.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 24);
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
}

function hit(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function loadHighScore() {
    const ranking = JSON.parse(localStorage.getItem("shootingRanking")) || [];
    highScore.textContent = ranking[0] || 0;
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

resizeCanvas();
initStars();
