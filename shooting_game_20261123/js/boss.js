/* ==========================
   BOSS
========================== */

let stageBossDefeated = false;

let boss = null;
let bossSpawned = false;
let bossWarningActive = false;

let warningFrames = 0;
let bossShotFrames = 0;

const MAX_ENEMY_BULLETS = 50;

let lastBossHp = -1;

/* ==========================
   RESET
========================== */

function resetBossState() {

    stageBossDefeated = false;

    boss = null;
    bossSpawned = false;
    bossWarningActive = false;

    warningFrames = 0;
    bossShotFrames = 0;

    lastBossHp = -1;

    bullets.length = 0;
    enemyBullets.length = 0;

    bossContainer.classList.add(
        "hidden"
    );

    bossFill.style.width = "100%";
}

/* ==========================
   WARNING
========================== */

function triggerBossWarning() {

    if (
        bossSpawned ||
        bossWarningActive
    ) {
        return;
    }

    bossWarningActive = true;

    warningFrames = 60;

    /* 安全のため全部クリア */
    bullets.length = 0;
    enemies.length = 0;
    enemyBullets.length = 0;
}

/* ==========================
   BOSS SPAWN
========================== */

function finalizeBossSpawn() {

    bossWarningActive = false;

    bossSpawned = true;

    bossShotFrames = 0;

    bossContainer.classList.remove(
        "hidden"
    );

    const bossHp =
        STAGE_BOSS_HP[stage];

    boss = {

        x: Math.max(
            80,
            canvas.width - 280
        ),

        y: Math.max(
            0,
            canvas.height / 2 - 100
        ),

        width: 240,
        height: 200,

        hp: bossHp,
        maxHp: bossHp,

        speed:
            3 +
            (
                stage - 1
            ) * 0.5,

        dir: 1
    };

    stageBossDefeated = false;

    lastBossHp = boss.hp;

    bossFill.style.width =
        "100%";

    startShake(
        6,
        12
    );

    setTimeout(() => {

        try {

            if (
                audioCtx &&
                audioCtx.state === "running"
            ) {

                setBGMMode("boss");
            }

        } catch (e) {

            console.error(
                "Boss BGM Error",
                e
            );
        }

    }, 200);
}

/* ==========================
   WARNING COUNTDOWN
========================== */

function updateWarningCountdown() {

    if (
        warningFrames <= 0
    ) {
        return false;
    }

    warningFrames--;

    if (
        warningFrames === 0
    ) {

        finalizeBossSpawn();
    }

    return true;
}

/* ==========================
   UPDATE
========================== */

function updateBoss() {

    if (!boss) {
        return;
    }

    /* 移動 */

    boss.y +=
        boss.speed *
        boss.dir;

    if (
        boss.y < 0 ||
        boss.y +
        boss.height >
        canvas.height
    ) {

        boss.dir *= -1;
    }

    /* 発射 */

    bossShotFrames++;

    const shotInterval =
        Math.max(
            25,
            60 -
            (
                stage - 1
            ) * 8
        );

    if (
        bossShotFrames >=
        shotInterval
    ) {

        bossShotFrames = 0;

        let spread = 2;

        if (stage === 2) {

            spread = 3;

        } else if (
            stage === 3
        ) {

            spread = 4;

        } else if (
            stage >= 4
        ) {

            spread = 5;
        }

        for (
            let i = -spread;
            i <= spread;
            i++
        ) {

            if (
                enemyBullets.length >=
                MAX_ENEMY_BULLETS
            ) {

                enemyBullets.shift();
            }

            enemyBullets.push({

                x: boss.x,

                y:
                    boss.y +
                    boss.height / 2,

                width: 14,
                height: 14,

                dx: -6,

                dy: i * 1.2
            });
        }
    }

    /* 弾命中 */

    for (
        let bi =
            bullets.length - 1;
        bi >= 0;
        bi--
    ) {

        const bullet =
            bullets[bi];

        if (!bullet) {
            continue;
        }

        if (
            hit(
                bullet,
                boss
            )
        ) {

            bullets.splice(
                bi,
                1
            );

            boss.hp--;

            startShake(
                2,
                4
            );

            if (
                boss.hp <= 0
            ) {

                for (
                    let k = 0;
                    k < 8;
                    k++
                ) {

                    createExplosion(

                        boss.x +
                        Math.random() *
                        boss.width,

                        boss.y +
                        Math.random() *
                        boss.height,

                        "#ff2200",

                        6
                    );
                }

                startShake(
                    20,
                    40
                );

                score += 1000;

                stageBossDefeated = true;

                boss = null;

                bullets.length = 0;
                enemies.length = 0;
                enemyBullets.length = 0;

                bossSpawned = false;

                bossContainer.classList.add(
                    "hidden"
                );

                setBGMMode(
                    "normal"
                );

                /* ==========================
                   STAGE CLEAR
                ========================== */

                if (
                    stage >=
                    MAX_STAGE
                ) {

                    showStageMessage(
                        "GAME CLEAR",
                        180
                    );

                    gameClear();

                } else {

                    const nextStage =
                        stage + 1;

                    showStageMessage(
                        "STAGE " +
                        stage +
                        " CLEAR",
                        120
                    );

                    stage++;

                    updateStageDisplay();

                    player.hp =
                        player.maxHp;

                    setTimeout(
                        () => {

                            showStageMessage(
                                "STAGE " +
                                nextStage +
                                " START",
                                90
                            );

                        },
                        2000
                    );
                }

                break;
            }
        }
    }

    /* HP BAR */

    if (
        boss &&
        boss.hp !==
        lastBossHp
    ) {

        lastBossHp =
            boss.hp;

        bossFill.style.width =
            (
                boss.hp /
                boss.maxHp
            ) * 100 + "%";
    }
}

/* ==========================
   DRAW
========================== */

function drawBoss() {

    if (
        !boss ||
        !images.boss
    ) {
        return;
    }

    ctx.drawImage(
        images.boss,
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );
}