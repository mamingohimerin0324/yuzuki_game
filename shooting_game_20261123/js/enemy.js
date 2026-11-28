/* ==========================
   ENEMY & ENEMY BULLETS
========================== */

let enemySpawnFrames = 0;

function resetEnemies() {

    enemySpawnFrames = 0;

    enemies.length = 0;
    enemyBullets.length = 0;
}

function checkBossSpawnCondition() {

    if (
        !gameRunning ||
        bossSpawned ||
        bossWarningActive ||
        stageBossDefeated
    ) {
        return;
    }

    const targetScore = STAGE_BOSS_SCORE[stage];
    const earnedInStage = score - stageStartScore;

    if (
        typeof targetScore === "number" &&
        earnedInStage >= targetScore
    ) {
        triggerBossWarning();
    }
}

function updateEnemySpawner() {

    if (
        !gameRunning ||
        bossSpawned ||
        warningFrames > 0 ||
        bossWarningActive
    ) {
        return;
    }

    enemySpawnFrames++;

    const spawnInterval =
        Math.max(
            20,
            60 - (stage - 1) * 10
        );

    if (enemySpawnFrames >= spawnInterval) {

        enemySpawnFrames = 0;

        enemies.push({
            x: canvas.width + 60,
            y: Math.random() *
                Math.max(
                    10,
                    canvas.height - 50
                ),
            width: 50,
            height: 50,
            speed:
                2 +
                (stage - 1) * 0.5
        });
    }
}

function updateEnemiesAndBullets() {

    updateEnemySpawner();

    /* ==========================
       ENEMIES
    ========================== */

    for (
        let ei = enemies.length - 1;
        ei >= 0;
        ei--
    ) {

        const e = enemies[ei];

        if (!e) continue;

        e.x -= e.speed;

        if (e.x < -100) {

            enemies.splice(ei, 1);

            continue;
        }

        let enemyDestroyed = false;

        for (
            let bi = bullets.length - 1;
            bi >= 0;
            bi--
        ) {

            const bullet = bullets[bi];

            if (!bullet) {
                continue;
            }

            if (hit(e, bullet)) {

                bullets.splice(bi, 1);

                enemies.splice(ei, 1);

                enemyDestroyed = true;

                score += 100;

                if (Math.random() < 0.15) {

                    items.push({
                        x: e.x,
                        y: e.y,
                        width: 30,
                        height: 30,
                        speed: 2,
                        type: "power"
                    });
                }

                createExplosion(
                    e.x + e.width / 2,
                    e.y + e.height / 2
                );

                startShake(3, 8);

                playSound(
                    300,
                    0.06
                );

                checkBossSpawnCondition();

                break;
            }
        }

        if (
            enemyDestroyed ||
            warningFrames > 0
        ) {
            continue;
        }

        if (hit(e, player)) {

            enemies.splice(ei, 1);

            player.hp -= 20;

            createExplosion(
                player.x +
                player.width / 2,
                player.y +
                player.height / 2,
                "#00ffff"
            );

            startShake(
                10,
                15
            );

            playSound(
                100,
                0.15
            );
        }
    }

    /* ==========================
       ENEMY BULLETS
    ========================== */

    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];

        if (!b) {
            continue;
        }

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

        /* ==========================
           BULLET VS BULLET
        ========================== */

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
                    b,
                    bullet
                )
            ) {

                enemyBullets.splice(
                    i,
                    1
                );

                bullets.splice(
                    bi,
                    1
                );

                bulletCleared = true;

                if (
                    shockwaves.length >=
                    MAX_SHOCKWAVES
                ) {

                    shockwaves.shift();
                }

                shockwaves.push({

                    x: b.x,
                    y: b.y,
                    radius: 5,
                    alpha: 1
                });

                score += 10;

                createExplosion(
                    b.x,
                    b.y,
                    "#ffff00",
                    3
                );

                createExplosion(
                    b.x,
                    b.y,
                    "#ffffff",
                    2
                );

                startShake(
                    2,
                    4
                );

                /*
                 * Safari対策
                 */
                // playSound(900, 0.03);

                checkBossSpawnCondition();

                break;
            }
        }

        if (bulletCleared) {
            continue;
        }

        /* ==========================
           PLAYER HIT
        ========================== */

        if (
            hit(
                b,
                player
            )
        ) {

            enemyBullets.splice(
                i,
                1
            );

            player.hp -= 10;

            createExplosion(
                player.x +
                player.width / 2,
                player.y +
                player.height / 2,
                "#00ffff"
            );

            startShake(
                8,
                12
            );

            playSound(
                150,
                0.15
            );
        }
    }
}

function drawEnemiesAndBullets() {

    enemies.forEach(e => {

        if (!e) return;

        if (images.enemy) {

            ctx.drawImage(
                images.enemy,
                e.x,
                e.y,
                e.width,
                e.height
            );
        }
    });

    ctx.fillStyle = "#ff00ff";

    enemyBullets.forEach(b => {

        if (!b) return;

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });
}

function updateItems() {

    for (
        let i = items.length - 1;
        i >= 0;
        i--
    ) {

        const item = items[i];

        if (!item) {
            continue;
        }

        item.x -= item.speed;

        if (item.x < -50) {

            items.splice(i, 1);

            continue;
        }

        if (
            hit(
                item,
                player
            )
        ) {

            weaponLevel =
                Math.min(
                    weaponLevel + 1,
                    3
                );

            playSound(
                1200,
                0.1
            );

            items.splice(i, 1);
        }
    }
}
    