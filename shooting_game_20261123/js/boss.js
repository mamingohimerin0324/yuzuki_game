/* ==========================
   BOSS
========================== */
let boss = null;
let bossSpawned = false;
let warningFrames = 0;
let bossShotFrames = 0;

function resetBossState() {
    boss = null;
    bossSpawned = false;
    warningFrames = 0;
    bossShotFrames = 0;
    warningEl?.classList.add("hidden");
    bossContainer.classList.add("hidden");
    bossFill.style.width = "100%";
}

function triggerBossWarning() {
    if (bossSpawned || warningFrames > 0) return;

    warningFrames = 120; // 約2秒（60fps換算）
    enemies.length = 0;
    enemyBullets.length = 0;
    warningEl?.classList.remove("hidden");
    setBGMMode("none");
}

function finalizeBossSpawn() {
    warningEl?.classList.add("hidden");
    bossSpawned = true;
    bossShotFrames = 0;

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

    for (let i = 0; i < 8; i++) {
        createExplosion(
            boss.x + Math.random() * boss.width * 0.6,
            boss.y + Math.random() * boss.height * 0.6,
            "#ff3300",
            10
        );
    }

    startShake(15, 25);
    playSound(80, 0.2);
    setBGMMode("boss");
}

function updateWarningCountdown() {
    if (warningFrames <= 0) return false;

    warningFrames--;
    if (warningFrames === 0) {
        finalizeBossSpawn();
    }
    return true;
}

function updateBoss() {
    if (!boss) return;

    boss.y += boss.speed * boss.dir;
    if (boss.y < 0 || boss.y + boss.height > canvas.height) {
        boss.dir *= -1;
    }

    bossShotFrames++;
    if (bossShotFrames >= 60) {
        bossShotFrames = 0;
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
    }

    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        if (hit(bullets[bi], boss)) {
            bullets.splice(bi, 1);
            boss.hp--;
            startShake(2, 4);

            if (boss.hp <= 0) {
                for (let k = 0; k < 12; k++) {
                    createExplosion(
                        boss.x + Math.random() * boss.width,
                        boss.y + Math.random() * boss.height,
                        "#ff2200",
                        10
                    );
                }
                startShake(20, 40);
                score += 2000;
                boss = null;
                bossContainer.classList.add("hidden");
                gameClear();
                break;
            }
        }
    }

    if (boss) {
        bossFill.style.width = (boss.hp / boss.maxHp) * 100 + "%";
    }
}

function drawBoss() {
    if (boss && images.boss) {
        ctx.drawImage(images.boss, boss.x, boss.y, boss.width, boss.height);
    }
}
