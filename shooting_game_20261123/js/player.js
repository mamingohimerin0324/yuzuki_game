/* ==========================
   MOUSE CONTROL
========================== */

let mouseX = 0;
let mouseY = 0;

let mouseControl = false;
let mouseFiring = false;

let autoFireFrame = 0;
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

let weaponLevel = 1;
let moveX = 0;
let moveY = 0;

/* HPバー最適化 */
let lastPlayerHp = -1;

/* ==========================
   RESET
========================== */

function resetPlayer() {

    player.x = 80;
    player.y = canvas.height / 2 - 30;
    player.hp = player.maxHp;

    moveX = 0;
    moveY = 0;

    weaponLevel = 1;

    lastPlayerHp = player.hp;

    hpFill.style.width = "100%";
    mouseX = player.x;
    mouseY = player.y;

    mouseControl = false;
    mouseFiring = false;

    autoFireFrame = 0;
}

/* ==========================
   SHOOT
========================== */

function shoot() {

    if (bullets.length >= MAX_BULLETS) {
        return;
    }

    if (
        !gameRunning ||
        (
            typeof warningFrames !== "undefined" &&
            warningFrames > 0
        )
    ) {
        return;
    }

    if (weaponLevel === 1) {

        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - 6,
            width: 20,
            height: 12,
            dx: 12,
            dy: 0
        });

    } else {

        bullets.push(
            {
                x: player.x + player.width,
                y: player.y + player.height / 2 - 6,
                width: 20,
                height: 12,
                dx: 12,
                dy: 0
            },
            {
                x: player.x + player.width,
                y: player.y + player.height / 2 - 6,
                width: 20,
                height: 12,
                dx: 11,
                dy: -2
            },
            {
                x: player.x + player.width,
                y: player.y + player.height / 2 - 6,
                width: 20,
                height: 12,
                dx: 11,
                dy: 2
            }
        );
    }

    playSound(800, 0.05);
}

/* ==========================
   UPDATE
========================== */

function updatePlayer() {

    player.x += moveX * player.speed;
    player.y += moveY * player.speed;

    player.x = Math.max(
        0,
        Math.min(
            canvas.width - player.width,
            player.x
        )
    );

    player.y = Math.max(
        0,
        Math.min(
            canvas.height - player.height,
            player.y
        )
    );
    if (mouseControl) {

        const targetX =
            mouseX - player.width / 2;

        const targetY =
            mouseY - player.height / 2;

        player.x +=
            (targetX - player.x) * 0.15;

        player.y +=
            (targetY - player.y) * 0.15;
    }
    /* BULLETS */

    for (let i = bullets.length - 1; i >= 0; i--) {

        bullets[i].x += bullets[i].dx;
        bullets[i].y += bullets[i].dy;

        if (bullets[i].x > canvas.width + 50) {
            bullets.splice(i, 1);
        }
    }

    /* HP BAR UPDATE */

    if (player.hp !== lastPlayerHp) {

        lastPlayerHp = player.hp;

        hpFill.style.width =
            Math.max(
                0,
                (player.hp / player.maxHp) * 100
            ) + "%";
    }
    if (
        mouseControl &&
        mouseFiring &&
        gameRunning
    ) {

        autoFireFrame++;

        if (autoFireFrame >= 6) {

            autoFireFrame = 0;

            shoot();
        }

    } else {

        autoFireFrame = 0;
    }
}

/* ==========================
   DRAW
========================== */

function drawPlayerAndBullets() {

    if (images.player) {

        ctx.drawImage(
            images.player,
            player.x,
            player.y,
            player.width,
            player.height
        );
    }

    bullets.forEach(b => {

        if (images.bullet) {

            ctx.drawImage(
                images.bullet,
                b.x,
                b.y,
                b.width,
                b.height
            );
        }
    });
}

/* ==========================
   CONTROLS
========================== */

function bindPlayerControls() {

    /* ----- PC Keyboard ----- */

    window.addEventListener("keydown", e => {

        if (e.key === "ArrowUp") {
            moveY = -1;
        }

        if (e.key === "ArrowDown") {
            moveY = 1;
        }

        if (e.key === "ArrowLeft") {
            moveX = -1;
        }

        if (e.key === "ArrowRight") {
            moveX = 1;
        }

        if (e.code === "Space") {
            shoot();
        }
    });

    window.addEventListener("keyup", e => {

        if (
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            moveY = 0;
        }

        if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight"
        ) {
            moveX = 0;
        }
    });

    /* ----- Tab Hidden ----- */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.hidden) {

                moveX = 0;
                moveY = 0;
            }
        }
    );

    /* ----- Fire Button ----- */

    document
        .getElementById("fireBtn")
        ?.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                unlockAudio();

                shoot();
            },
            { passive: false }
        );

    canvas.addEventListener("click", () => {

        unlockAudio();

        shoot();
    });

    /* ==========================
       JOYSTICK
    ========================== */

    const joystick =
        document.getElementById("joystick");

    const stick =
        document.getElementById("stick");

    if (!joystick || !stick) {
        return;
    }

    let dragging = false;

    function updateStick(touch) {

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        let dx =
            touch.clientX - centerX;

        let dy =
            touch.clientY - centerY;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        const maxDistance =
            rect.width * 0.35;

        if (
            distance > maxDistance &&
            distance > 0
        ) {

            dx =
                dx / distance *
                maxDistance;

            dy =
                dy / distance *
                maxDistance;
        }

        stick.style.left =
            rect.width / 2 -
            stick.offsetWidth / 2 +
            dx +
            "px";

        stick.style.top =
            rect.height / 2 -
            stick.offsetHeight / 2 +
            dy +
            "px";

        moveX = dx / maxDistance;
        moveY = dy / maxDistance;
    }

    function resetJoystick() {

        moveX = 0;
        moveY = 0;

        stick.style.left =
            joystick.clientWidth / 2 -
            stick.offsetWidth / 2 +
            "px";

        stick.style.top =
            joystick.clientHeight / 2 -
            stick.offsetHeight / 2 +
            "px";
    }
    /* ==========================
       PC MOUSE CONTROL
    ========================== */

    canvas.addEventListener(
        "mousemove",
        e => {

            const rect =
                canvas.getBoundingClientRect();

            mouseX =
                e.clientX - rect.left;

            mouseY =
                e.clientY - rect.top;

            mouseControl = true;
        }
    );

    canvas.addEventListener(
        "mousedown",
        () => {

            mouseControl = true;

            mouseFiring = true;

            unlockAudio();
        }
    );

    window.addEventListener(
        "mouseup",
        () => {

            mouseFiring = false;
        }
    );

    canvas.addEventListener(
        "mouseleave",
        () => {

            mouseFiring = false;
        }
    );
    joystick.addEventListener(
        "touchstart",
        e => {

            dragging = true;

            unlockAudio();

            updateStick(
                e.touches[0]
            );
        },
        { passive: false }
    );

    joystick.addEventListener(
        "touchmove",
        e => {

            if (!dragging) return;

            e.preventDefault();

            updateStick(
                e.touches[0]
            );
        },
        { passive: false }
    );

    joystick.addEventListener(
        "touchend",
        () => {

            dragging = false;

            resetJoystick();
        }
    );

    joystick.addEventListener(
        "touchcancel",
        () => {

            dragging = false;

            resetJoystick();
        }
    );

    resetJoystick();
}

/* ==========================
   INIT
========================== */

resetPlayer();
bindPlayerControls();