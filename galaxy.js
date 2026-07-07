var canvas = document.getElementById('galaxy');
var ctx = canvas.getContext('2d', { alpha: false });
var startButton = document.getElementById('startButton');
var width = 0;
var height = 0;
var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
var particles = [];
var stars = [];
var dust = [];
var planets = [];
var sunCore = [];
var textTargets = [];
var message = 'Lory';
var started = false;
var startTime = 0;
var lastFrame = 0;
var fps = 60;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function easeInOut(t) {
    t = clamp(t, 0, 1);
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTextTargets();
    createStars();
    createDust();
    createSolarSystem();
}

function buildTextTargets() {
    var off = document.createElement('canvas');
    var offCtx = off.getContext('2d');
    off.width = Math.max(1, width);
    off.height = Math.max(1, height);

    var fontSize = Math.min(width, height) * 0.29;
    offCtx.fillStyle = '#fff';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.font = '700 ' + fontSize + "px 'Tangerine', cursive";
    offCtx.fillText(message, width / 2, height / 2 + fontSize * 0.04);

    var data = offCtx.getImageData(0, 0, off.width, off.height).data;
    textTargets = [];
    var gap = Math.max(6, Math.floor(Math.min(width, height) / 95));

    for (var y = 0; y < height; y += gap) {
        for (var x = 0; x < width; x += gap) {
            var index = (y * width + x) * 4 + 3;
            if (data[index] > 120) {
                textTargets.push({ x: x, y: y });
            }
        }
    }
}

function createStars() {
    stars = [];
    var total = Math.min(260, Math.floor(width * height / 3600));
    for (var i = 0; i < total; i++) {
        stars.push({
            x: rand(0, width),
            y: rand(0, height),
            r: rand(0.35, 1.55),
            a: rand(0.16, 0.88),
            pulse: rand(0.018, 0.045)
        });
    }
}

function createDust() {
    dust = [];
    var total = Math.min(3200, Math.floor(width * height / 300));
    for (var i = 0; i < total; i++) {
        dust.push({
            x: rand(0, width),
            y: rand(0, height),
            r: rand(0.35, 1.25),
            a: rand(0.05, 0.28),
            speed: rand(0.06, 0.22)
        });
    }
}

function createSolarSystem() {
    var base = Math.min(width, height);
    var centerX = width / 2;
    var centerY = height / 2;

    planets = [
        { name: 'Mercurio', orbit: 0.14, radius: 5, color: '#b8aaa0', accent: '#f0d6b8', speed: 1.72, angle: 0.5 },
        { name: 'Venus', orbit: 0.22, radius: 8, color: '#e7b45b', accent: '#fff1a6', speed: 1.25, angle: 1.9 },
        { name: 'Terra', orbit: 0.31, radius: 9, color: '#3f8cff', accent: '#43f0b1', speed: 0.98, angle: 3.2 },
        { name: 'Marte', orbit: 0.40, radius: 7, color: '#d65a3a', accent: '#ff9a66', speed: 0.82, angle: 4.6 },
        { name: 'Jupiter', orbit: 0.52, radius: 18, color: '#d9a66f', accent: '#fff0c7', speed: 0.56, angle: 2.7 },
        { name: 'Saturno', orbit: 0.65, radius: 16, color: '#e8cb83', accent: '#b89455', speed: 0.44, angle: 5.3 },
        { name: 'Urano', orbit: 0.77, radius: 12, color: '#8ce8e5', accent: '#d7ffff', speed: 0.34, angle: 0.1 },
        { name: 'Netuno', orbit: 0.89, radius: 12, color: '#496cff', accent: '#9fb5ff', speed: 0.28, angle: 3.8 }
    ];

    particles = [];
    makeSunParticles(centerX, centerY, base);

    for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        p.orbitPx = base * p.orbit * 0.64;
        p.radiusPx = Math.max(4, p.radius * base / 620);
        p.pullDelay = i * 0.16;
        p.explodeDelay = 3.9 + i * 0.12;
        p.particleStart = particles.length;
        makePlanetParticles(p, centerX, centerY);
        p.particleEnd = particles.length;
    }
}

function makePlanetParticles(planet, centerX, centerY) {
    var particleCount = Math.max(180, Math.floor(planet.radius * 42));
    var targetCount = Math.max(1, textTargets.length);
    var initialAngle = planet.angle;
    var orbitX = centerX + Math.cos(initialAngle) * planet.orbitPx;
    var orbitY = centerY + Math.sin(initialAngle) * planet.orbitPx * 0.45;

    for (var i = 0; i < particleCount; i++) {
        var a = rand(0, Math.PI * 2);
        var r = Math.sqrt(Math.random()) * planet.radiusPx;
        var target = textTargets[(particles.length * 5) % targetCount] || { x: centerX, y: centerY };
        particles.push({
            kind: 'planet',
            planet: planet,
            ox: Math.cos(a) * r,
            oy: Math.sin(a) * r,
            tx: target.x + rand(-1.4, 1.4),
            ty: target.y + rand(-1.4, 1.4),
            sx: orbitX,
            sy: orbitY,
            color: Math.random() > 0.72 ? planet.accent : planet.color,
            size: rand(0.55, 1.65),
            drift: rand(10, 54),
            alpha: rand(0.68, 1)
        });
    }

    if (planet.name === 'Saturno') {
        for (var ring = 0; ring < 220; ring++) {
            var ringAngle = rand(0, Math.PI * 2);
            var ringRadius = rand(planet.radiusPx * 1.45, planet.radiusPx * 2.15);
            var targetRing = textTargets[(particles.length * 5) % targetCount] || { x: centerX, y: centerY };
            particles.push({
                kind: 'planet',
                planet: planet,
                ox: Math.cos(ringAngle) * ringRadius,
                oy: Math.sin(ringAngle) * ringRadius * 0.28,
                tx: targetRing.x + rand(-1.4, 1.4),
                ty: targetRing.y + rand(-1.4, 1.4),
                sx: orbitX,
                sy: orbitY,
                color: Math.random() > 0.45 ? planet.accent : planet.color,
                size: rand(0.55, 1.25),
                drift: rand(14, 60),
                alpha: rand(0.48, 0.85)
            });
        }
    }
}

function makeSunParticles(centerX, centerY, base) {
    sunCore = [];
    var sunRadius = base * 0.075;
    var total = Math.min(900, Math.max(520, Math.floor(base * 1.05)));
    var targetCount = Math.max(1, textTargets.length);

    for (var i = 0; i < total; i++) {
        var a = rand(0, Math.PI * 2);
        var r = Math.sqrt(Math.random()) * sunRadius;
        var target = textTargets[(i * 7) % targetCount] || { x: centerX, y: centerY };
        var color = Math.random() > 0.35 ? '#ffd45c' : '#fff6c8';
        if (Math.random() > 0.82) color = '#ff8a30';

        var particle = {
            kind: 'sun',
            ox: Math.cos(a) * r,
            oy: Math.sin(a) * r,
            tx: target.x + rand(-1.2, 1.2),
            ty: target.y + rand(-1.2, 1.2),
            color: color,
            size: rand(0.55, 1.7),
            drift: rand(16, 70),
            alpha: rand(0.68, 1),
            spin: rand(-1.8, 1.8),
            explodeDelay: rand(4.35, 5.25)
        };
        sunCore.push(particle);
        particles.push(particle);
    }
}

function planetPosition(planet, elapsed) {
    var centerX = width / 2;
    var centerY = height / 2;
    var orbitAngle = planet.angle + elapsed * planet.speed;
    var orbitX = centerX + Math.cos(orbitAngle) * planet.orbitPx;
    var orbitY = centerY + Math.sin(orbitAngle) * planet.orbitPx * 0.45;
    var pull = easeInOut((elapsed - 1.25 - planet.pullDelay) / 3.1);
    var swirl = (1 - pull) * 0.04 * Math.sin(elapsed * 3 + planet.angle);

    return {
        x: orbitX + (centerX - orbitX) * pull + Math.cos(orbitAngle * 4) * swirl * planet.orbitPx,
        y: orbitY + (centerY - orbitY) * pull + Math.sin(orbitAngle * 4) * swirl * planet.orbitPx,
        pull: pull,
        angle: orbitAngle
    };
}

function drawBackground(time) {
    var centerX = width / 2;
    var centerY = height / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var twinkle = s.a + Math.sin(time * s.pulse + i) * 0.2;
        ctx.fillStyle = 'rgba(225, 238, 255, ' + Math.max(0.06, twinkle) + ')';
        ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var j = 0; j < dust.length; j++) {
        var d = dust[j];
        var driftX = Math.sin(time * d.speed + j) * 10;
        var driftY = Math.cos(time * d.speed * 0.7 + j) * 6;
        ctx.fillStyle = 'rgba(120, 170, 255, ' + d.a + ')';
        ctx.fillRect(d.x + driftX, d.y + driftY, d.r, d.r);
    }
    ctx.restore();
}

function drawSun(elapsed) {
    return;
}

function drawOrbits(elapsed) {
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 160, 255, 0.14)';
    ctx.lineWidth = 1;
    for (var i = 0; i < planets.length; i++) {
        var fade = 1 - easeInOut((elapsed - 1.3 - planets[i].pullDelay) / 2.4);
        if (fade <= 0.02) continue;
        ctx.globalAlpha = fade * 0.8;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, planets[i].orbitPx, planets[i].orbitPx * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPlanets(elapsed) {
    return;
}

function drawParticles(elapsed) {
    var centerX = width / 2;
    var centerY = height / 2;
    var textProgress = easeInOut((elapsed - 5.3) / 3.2);
    var glow = easeInOut((elapsed - 7.1) / 1.2);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var sourceX;
        var sourceY;
        var explode;
        var burstAngle;

        if (p.kind === 'sun') {
            explode = easeInOut((elapsed - p.explodeDelay) / 1.35);
            burstAngle = Math.atan2(p.oy, p.ox) + elapsed * p.spin;
            var sunSpinX = p.ox * Math.cos(elapsed * 0.55) - p.oy * Math.sin(elapsed * 0.55);
            var sunSpinY = p.ox * Math.sin(elapsed * 0.55) + p.oy * Math.cos(elapsed * 0.55);
            sourceX = centerX + sunSpinX * (1 - explode);
            sourceY = centerY + sunSpinY * (1 - explode);
        } else {
            var planet = p.planet;
            var pos = planetPosition(planet, elapsed);
            explode = easeInOut((elapsed - planet.explodeDelay) / 1.25);
            burstAngle = planet.angle + i * 2.399;
            var orbitSpark = Math.sin(elapsed * 3 + i) * 0.9;
            sourceX = pos.x + (p.ox + orbitSpark) * (1 - explode);
            sourceY = pos.y + (p.oy - orbitSpark) * (1 - explode);
        }

        var burstX = centerX + Math.cos(burstAngle) * p.drift * explode;
        var burstY = centerY + Math.sin(burstAngle) * p.drift * explode;
        sourceX += (burstX - centerX) * explode;
        sourceY += (burstY - centerY) * explode;
        var x = sourceX + (p.tx - sourceX) * textProgress;
        var y = sourceY + (p.ty - sourceY) * textProgress;
        var alpha = p.alpha * (0.55 + textProgress * 0.45);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, p.size + glow * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    if (glow > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(122, 176, 255, ' + (0.06 * glow) + ')';
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.min(width, height) * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawFps(now) {
    if (!lastFrame) lastFrame = now;
    var delta = Math.max(1, now - lastFrame);
    lastFrame = now;
    fps = fps * 0.92 + (1000 / delta) * 0.08;
    ctx.save();
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = fps >= 50 ? 'rgba(198, 255, 214, 0.72)' : 'rgba(255, 206, 126, 0.86)';
    ctx.fillText(Math.round(fps) + ' fps', 14, 24);
    ctx.restore();
}

function frame(now) {
    var elapsed = started ? (now - startTime) / 1000 : 0;
    drawBackground(now / 16);
    drawOrbits(elapsed);
    drawSun(elapsed);
    drawPlanets(elapsed);
    drawParticles(elapsed);
    drawFps(now);
    requestAnimationFrame(frame);
}

function start() {
    if (started) return;
    started = true;
    startTime = performance.now();
    startButton.classList.add('hidden');
}

window.addEventListener('resize', resize);
startButton.addEventListener('click', start);
resize();
requestAnimationFrame(frame);
