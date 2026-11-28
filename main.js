let lastScore = -1;

/* ==========================
   GAME FLOW, LOOP & ENTRY
========================== */

function finishGame(isClear) {

    setBGMMode("none");

    warningFrames = 30;

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

    items.length = 0;

    weaponLevel = 1;

    score = 0;

    stage = 1;

    lastScore = -1;

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

    /*
     * 背景・エフェクトは
     * 常時更新
     */
    updateStarsAndEffects();

    /*
     * WARNING演出中
     */
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

    /*
     * SCORE更新最適化
     */
    if (
        score !== lastScore
    ) {

        scoreEl.textContent = score;

        lastScore = score;
    }

    /*
     * STAGE表示更新
     */
    updateStageDisplay();

    /*
     * GAME OVER
     */
    if (player.hp <= 0) {

        gameOver();
    }
}

/* ==========================
   DRAW
========================== */

function draw() {

    ctx.clearRect(
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
    drawWarningMessage();
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

        ctx.save();

        ctx.fillStyle =
            "#ffff00";

        ctx.beginPath();

        ctx.arc(
            item.x + 15,
            item.y + 15,
            15,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#000";

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