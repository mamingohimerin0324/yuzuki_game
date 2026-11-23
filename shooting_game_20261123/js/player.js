/* ==========================
   PLAYER
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

const keys = {
    up: false,
    down: false
};

function resetPlayer() {
    player.x = 80;
    player.y = canvas.height / 2 - 30;
    player.hp = player.maxHp;
    keys.up = false;
    keys.down = false;
    hpFill.style.width = "100%";
}

function shoot() {
    if (!gameRunning || (typeof warningFrames !== "undefined" && warningFrames > 0)) return;

    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2 - 6,
        width: 20,
        height: 12,
        speed: 12
    });

    playSound(800, 0.05);
}

function updatePlayer() {
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

    hpFill.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + "%";
}

function drawPlayerAndBullets() {
    if (images.player) {
        ctx.drawImage(images.player, player.x, player.y, player.width, player.height);
    }

    bullets.forEach(b => {
        if (images.bullet) {
            ctx.drawImage(images.bullet, b.x, b.y, b.width, b.height);
        }
    });
}

function bindPlayerControls() {
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
        unlockAudio();
        shoot();
    }, { passive: false });

    canvas.addEventListener("click", () => {
        unlockAudio();
        shoot();
    });

    const upBtn = document.getElementById("upBtn");
    const downBtn = document.getElementById("downBtn");

    upBtn?.addEventListener("touchstart", e => {
        e.preventDefault();
        unlockAudio();
        keys.up = true;
    }, { passive: false });
    upBtn?.addEventListener("touchend", () => { keys.up = false; });
    upBtn?.addEventListener("touchcancel", () => { keys.up = false; });

    downBtn?.addEventListener("touchstart", e => {
        e.preventDefault();
        unlockAudio();
        keys.down = true;
    }, { passive: false });
    downBtn?.addEventListener("touchend", () => { keys.down = false; });
    downBtn?.addEventListener("touchcancel", () => { keys.down = false; });
}

resetPlayer();
bindPlayerControls();
