let lastScore = -1;

/* ==========================
   GAME FLOW, LOOP & ENTRY
========================== */

function finishGame(isClear) {

    setBGMMode("none");

    warningFrames = 0;
    bossWarningActive = false;

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

        clearScore.textContent =
            "SCORE : " + score;

        clearScreen.classList.remove(
            "hidden"
        );

    } else {

        finalScore.textContent =
            "SCORE : " + score;

        gameOverScreen.classList.remove(
            "hidden"
        );
    }
}

function gameOver() {

    finishGame(false);
}

function gameClear() {

    finishGame(true);
}

/* ==========================
   NEW GAME
========================== */

function startNewRun() {

    unlockAudio();

    score = 0;
    stage = 1;
    updateStageTheme();
    lastScore = -1;

    items.length = 0;

    weaponLevel = 1;

    titleScreen.classList.add(
        "hidden"
    );

    gameOverScreen.classList.add(
        "hidden"
    );

    clearScreen.classList.add(
        "hidden"
    );

    cleanupEffects();

    resetPlayer();
    resetEnemies();
    resetBossState();

    updateStageDisplay();

    gameRunning = true;

    setBGMMode("normal");
}

/* ==========================
   UPDATE
========================== */

function update() {

    updateStarsAndEffects();

    if (
        updateWarningCountdown()
    ) {
        return;
    }

    if (!gameRunning) {
        return;
    }

    updateBGM();

    updatePlayer();

    updateEnemiesAndBullets();

    updateItems();

    updateBoss();

    if (
        score !== lastScore
    ) {

        scoreEl.textContent = score;

        lastScore = score;
    }

    updateStageDisplay();

    if (player.hp <= 0) {

        gameOver();
    }
}

/* ==========================
   DRAW
========================== */

function draw() {

    const grad =
        ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width
        );

    grad.addColorStop(
        0,
        stageTheme.bg1
    );

    grad.addColorStop(
        1,
        stageTheme.bg2
    );

    ctx.fillStyle = grad;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawStarsAndEffects();

    drawPlayerAndBullets();

    drawEnemiesAndBullets();

    drawItems();

    drawBoss();

    /* WARNING演出 */
    drawWarningMessage();

    /* STAGE演出 */
    drawStageMessage();

    drawExplosionsAndShockwaves();

    endShakeTransform();
}

/* ==========================
   MAIN LOOP
========================== */

function loop() {

    update();

    draw();

    requestAnimationFrame(
        loop
    );
}

/* ==========================
   EVENTS
========================== */

window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

        player.x = 80;

        player.y = Math.min(
            player.y,
            canvas.height -
            player.height
        );

        initStars();
    }
);

startBtn.addEventListener(
    "click",
    startNewRun
);

restartBtn?.addEventListener(
    "click",
    () => location.reload()
);

clearRestartBtn?.addEventListener(
    "click",
    () => location.reload()
);

/* ==========================
   INIT
========================== */

async function initGame() {

    resetBossState();

    gameOverScreen.classList.add(
        "hidden"
    );

    clearScreen.classList.add(
        "hidden"
    );

    updateStageDisplay();

    try {

        await loadAssets();

        loadRanking();

        loadHighScore();

        loop();

    } catch (err) {

        console.error(
            "SVG読込エラー",
            err
        );

        alert(
            "assets/svg フォルダと SVG ファイルを確認してください"
        );
    }
}

initGame();

/* ==========================
   ITEM DRAW
========================== */

function drawItems() {

    items.forEach(item => {

        if (!item) {
            return;
        }

        ctx.save();

        ctx.fillStyle = "#ffff00";

        ctx.beginPath();

        ctx.arc(
            item.x + 15,
            item.y + 15,
            15,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#000";

        ctx.font =
            "bold 16px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            "P",
            item.x + 15,
            item.y + 21
        );

        ctx.restore();
    });
}