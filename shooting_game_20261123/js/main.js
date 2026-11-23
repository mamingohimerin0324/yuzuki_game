/* ==========================
   GAME FLOW, LOOP & ENTRY
========================== */
function finishGame(isClear) {
    setBGMMode("none");
    warningFrames = 0;
    warningEl?.classList.add("hidden");
    gameRunning = false;

    if (!isClear) {
        for (let i = 0; i < 15; i++) {
            createExplosion(
                player.x + player.width / 2,
                player.y + player.height / 2,
                "#00ffff",
                10
            );
        }
        startShake(18, 35);
    }

    saveRanking();
    loadRanking();
    loadHighScore();

    if (isClear) {
        clearScore.textContent = "SCORE : " + score;
        clearScreen.classList.remove("hidden");
    } else {
        finalScore.textContent = "SCORE : " + score;
        gameOverScreen.classList.remove("hidden");
    }
}

function gameOver() {
    finishGame(false);
}

function gameClear() {
    finishGame(true);
}

function startNewRun() {
    unlockAudio();

    titleScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    clearScreen.classList.add("hidden");

    score = 0;
    scoreEl.textContent = score;

    bullets.length = 0;
    explosions.length = 0;
    shockwaves.length = 0;

    resetPlayer();
    resetEnemies();
    resetBossState();

    gameRunning = true;
    setBGMMode("normal");
}

function update() {
    updateStarsAndEffects();

    if (!gameRunning) return;

    updateBGM();

    if (updateWarningCountdown()) return;

    updatePlayer();
    updateEnemiesAndBullets();
    updateBoss();

    scoreEl.textContent = score;

    if (player.hp <= 0) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStarsAndEffects();
    drawPlayerAndBullets();
    drawEnemiesAndBullets();
    drawBoss();
    drawExplosionsAndShockwaves();
    endShakeTransform();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener("resize", () => {
    resizeCanvas();
    player.x = 80;
    player.y = Math.min(player.y, canvas.height - player.height);
    initStars();
});

startBtn.addEventListener("click", startNewRun);
restartBtn?.addEventListener("click", () => location.reload());
clearRestartBtn?.addEventListener("click", () => location.reload());

async function initGame() {
    resetBossState();
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

initGame();
