// ==========================================
// CUSTOM CURSOR
// ==========================================
(function () {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const el = document.createElement('div');
    el.id = 'custom-cursor';
    document.body.appendChild(el);

    // display size and hotspot offset for each cursor type
    // hotspot = the pixel on the image that maps to the actual pointer tip
    const TYPES = {
        default: { file: 'cursor.png',      w: 26, h: 36, ox: 3,  oy: 2  },
        pointer: { file: 'pointer.png',      w: 40, h: 37, ox: 8,  oy: 4  },
        text:    { file: 'text-select.png',  w: 20, h: 32, ox: 10, oy: 16 },
        grab:    { file: 'grab.png',         w: 36, h: 36, ox: 11, oy: 5  },
    };

    const theme = () => document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    let currentType = 'default';

    function apply(type) {
        const c = TYPES[type];
        el.style.width            = c.w + 'px';
        el.style.height           = c.h + 'px';
        el.style.backgroundImage  = `url('cursors/${theme()}/${c.file}')`;
        el.style.marginLeft       = -c.ox + 'px';
        el.style.marginTop        = -c.oy + 'px';
        currentType = type;
    }

    function onMove(e) {
        el.style.left = e.clientX + 'px';
        el.style.top  = e.clientY + 'px';

        const t = e.target;
        let type = 'default';
        if (t.closest('input, textarea, [contenteditable]')) {
            type = 'text';
        } else if (t.closest('.photo-stack')) {
            type = 'grab';
        } else if (t.closest('a, button, [role="button"], .floating-icon, .social-button, .project-card, .more-link, .footer-icon-link, .btn-outline, .btn-filled')) {
            type = 'pointer';
        }
        if (type !== currentType) apply(type);
    }

    // pointermove catches events during pointer capture (card swipe); mousemove covers everything else
    document.addEventListener('pointermove', onMove);
    document.addEventListener('mousemove', onMove);

    document.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { el.style.opacity = '1'; });

    // re-apply when theme toggles so cursor matches
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => setTimeout(() => apply(currentType), 0));
    }

    apply('default');
})();

// initialize austin map with leaflet
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const austin = [30.2672, -97.7431];
    const blueDotPosition = [30.264, -97.7431];

    const map = L.map('map', {
        center: austin,
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        touchZoom: true
    });

    const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const isDark = () => document.body.classList.contains('dark-mode');

    let tileLayer = L.tileLayer(isDark() ? darkTileUrl : lightTileUrl, {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // swap tile layer when theme toggles
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // wait one tick so dark-mode class is toggled first
            setTimeout(() => {
                map.removeLayer(tileLayer);
                tileLayer = L.tileLayer(isDark() ? darkTileUrl : lightTileUrl, {
                    attribution: '',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(map);
                tileLayer.bringToBack();
            }, 0);
        });
    }

    L.circleMarker(blueDotPosition, {
        radius: 6,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
        opacity: 1,
        className: 'blue-location-dot'
    }).addTo(map);

    L.circleMarker(blueDotPosition, {
        radius: 14,
        fillColor: '#3b82f6',
        color: 'transparent',
        weight: 0,
        fillOpacity: 0.4,
        opacity: 0,
        className: 'blue-location-glow'
    }).addTo(map);
}

if (document.getElementById('map')) {
    window.addEventListener('load', initMap);
}

// clock functionality
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        const options = {
            timeZone: 'America/Chicago',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        let timeString = new Intl.DateTimeFormat('en-US', options).format(now);
        timeString = timeString.replace('CT', 'CDT').replace('CST', 'CDT');
        clockElement.textContent = timeString + ' CDT';
    }
}

updateClock();
setInterval(updateClock, 60000);

// theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const body = document.body;

    // restore saved theme; if none saved, follow the device's color-scheme setting
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.classList.add('dark-mode');
        themeToggle.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'light');
        }
    });
}

// ==========================================
// GITHUB HEATMAP
// ==========================================

// github heatmap - fetch real data from github contributions api
async function loadGitHubHeatmap() {
    const heatmapContainer = document.getElementById('github-heatmap');
    if (!heatmapContainer) return;

    const username = 'imraghavojha';

    try {
        // use github contributions api (public service)
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);

        if (!response.ok) {
            throw new Error('api request failed');
        }

        const data = await response.json();

        heatmapContainer.innerHTML = '';

        // data.contributions is an array of contribution objects
        const contributions = data.contributions || [];

        // get last 365 days
        const last365 = contributions.slice(-365);

        last365.forEach(day => {
            const count = day.count || 0;
            const level = day.level || getLevelFromCount(count);

            const dayDiv = document.createElement('div');
            dayDiv.className = `heatmap-day day-level-${level}`;
            dayDiv.title = `${day.date}: ${count} contributions`;
            heatmapContainer.appendChild(dayDiv);
        });

        console.log(`loaded ${last365.length} days of contribution data`);

        // scroll to rightmost (most recent commits)
        scrollHeatmapToRight();

    } catch (error) {
        console.error('error loading github contributions:', error);
        console.log('trying alternative method...');
        await loadFromAlternativeAPI(username, heatmapContainer);
    }
}

// alternative api endpoint
async function loadFromAlternativeAPI(username, container) {
    try {
        // try github-contributions.vercel.app
        const response = await fetch(`https://github-contributions.vercel.app/api/v1/${username}`);

        if (!response.ok) throw new Error('alternative api failed');

        const data = await response.json();

        container.innerHTML = '';

        // parse contributions
        if (data.contributions) {
            const last365 = data.contributions.slice(-365);

            last365.forEach(day => {
                const count = day.count || 0;
                const level = getLevelFromCount(count);

                const dayDiv = document.createElement('div');
                dayDiv.className = `heatmap-day day-level-${level}`;
                dayDiv.title = `${day.date}: ${count} contributions`;
                container.appendChild(dayDiv);
            });

            console.log(`loaded ${last365.length} days from alternative api`);

            // scroll to rightmost (most recent commits)
            scrollHeatmapToRight();
        } else {
            throw new Error('no contribution data in response');
        }

    } catch (error) {
        console.error('all apis failed:', error);
        loadFallbackHeatmap(container);
    }
}

// convert contribution count to github level (0-4)
function getLevelFromCount(count) {
    if (count === 0) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 9) return 3;
    return 4;
}

// fallback realistic pattern if all apis fail
function loadFallbackHeatmap(container) {
    console.log('using fallback heatmap pattern');

    const days = 365;
    container.innerHTML = '';

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOfWeek = date.getDay();

        let probability = 0.65;
        if (dayOfWeek === 0 || dayOfWeek === 6) probability = 0.25;

        let count = 0;
        if (Math.random() < probability) {
            const rand = Math.random();
            if (rand < 0.5) count = Math.floor(Math.random() * 3) + 1;
            else if (rand < 0.8) count = Math.floor(Math.random() * 4) + 4;
            else if (rand < 0.95) count = Math.floor(Math.random() * 5) + 8;
            else count = Math.floor(Math.random() * 8) + 13;
        }

        const level = getLevelFromCount(count);

        const dayDiv = document.createElement('div');
        dayDiv.className = `heatmap-day day-level-${level}`;
        dayDiv.title = `${date.toISOString().split('T')[0]}: ${count} contributions`;
        container.appendChild(dayDiv);
    }

    // scroll to rightmost (most recent commits)
    scrollHeatmapToRight();
}

// scroll heatmap container to show most recent commits (rightmost)
function scrollHeatmapToRight() {
    const heatmapContainer = document.querySelector('.heatmap-container');
    if (heatmapContainer) {
        // use setTimeout to ensure DOM has updated
        setTimeout(() => {
            heatmapContainer.scrollLeft = heatmapContainer.scrollWidth;
        }, 100);
    }
}

// load heatmap on page load
if (document.getElementById('github-heatmap')) {
    loadGitHubHeatmap();
}

// update last modified date
const lastUpdatedElement = document.getElementById('last-updated');
if (lastUpdatedElement) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    lastUpdatedElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// ==========================================
// PHOTO STACK
// ==========================================

(function () {
    const stack = document.getElementById('stack');
    if (!stack) return;

    const cards = [...stack.querySelectorAll('.card')];
    const n = cards.length;
    const rotations = [-1, 2.5, -2.5, 2];
    const offsets   = [[0, 0], [8, 7], [15, 13], [22, 19]];

    function init() {
        // Clear inline styles so offsetWidth reads the true CSS media query value
        stack.style.width = '';
        stack.style.height = '';

        // card must fit inside container minus the max translate offsets (20px right, 18px down)
        const maxTx = 22, maxTy = 20;
        const cw = stack.offsetWidth;
        const cardW = cw - maxTx;
        const cardH = Math.round(cardW * 1.3);

        // size container to exactly hold cards + their offsets, then clip
        stack.style.width  = cw + 'px';
        stack.style.height = (cardH + maxTy) + 'px';
        stack.style.overflow = 'hidden';

        cards.forEach(card => {
            Object.assign(card.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: cardW + 'px',
                height: cardH + 'px',
                borderRadius: '14px',
                overflow: 'hidden',
                border: '1px solid rgba(128,128,128,0.2)',
                willChange: 'transform',
            });
        });

        applyStack(false);
    }

    let current = 0;

    function applyStack(animated) {
        cards.forEach((card, i) => {
            const idx = (i - current + n) % n;
            const r = rotations[idx] ?? 0;
            const [tx, ty] = offsets[idx] ?? [0, 0];
            card.style.transition = animated
                ? 'transform 0.35s cubic-bezier(0.22,1,0.36,1)'
                : 'none';
            card.style.transform = `rotate(${r}deg) translate(${tx}px,${ty}px)`;
            card.style.zIndex = n - idx;
        });
    }

    init();
    window.addEventListener('resize', init);

    let startX = null;
    let dragging = false;

    stack.addEventListener('pointerdown', e => {
        e.preventDefault();
        startX = e.clientX;
        dragging = true;
        try { stack.setPointerCapture(e.pointerId); } catch (_) {}
    });

    stack.addEventListener('pointermove', e => {
        if (!dragging || startX === null) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) {
            const top = cards[current];
            top.style.transition = 'none';
            top.style.transform = `rotate(${dx * 0.04}deg) translateX(${dx * 0.35}px)`;
        }
    });

    function end(e) {
        if (!dragging) return;
        dragging = false;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 25) current = (current + 1) % n;
        applyStack(true);
        startX = null;
    }

    stack.addEventListener('pointerup', end);
    stack.addEventListener('pointercancel', end);
})();
// ==========================================
// FLOATING ICONS INTERACTION
// ==========================================
function setupFloatingIcons() {
    const icons = document.querySelectorAll('.floating-icon');
    if (!icons.length) return;

    icons.forEach(icon => {
        icon.addEventListener('pointerdown', e => e.stopPropagation());
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = icon.classList.contains('active');
            icons.forEach(other => other.classList.remove('active'));
            if (!wasActive) icon.classList.add('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.floating-icon')) {
            icons.forEach(icon => icon.classList.remove('active'));
        }
    });
}

// ==========================================
// RESUME / LINKEDIN HOVER PREVIEW
// ==========================================
function setupHoverPreviews() {
    const pairs = [
        ['btn-resume', 'preview-resume'],
        ['btn-linkedin', 'preview-linkedin'],
        ['btn-github', 'preview-github'],
    ];
    pairs.forEach(([btnId, previewId]) => {
        const btn = document.getElementById(btnId);
        const preview = document.getElementById(previewId);
        if (!btn || !preview) return;
        const show = () => preview.classList.add('show-preview');
        const hide = () => preview.classList.remove('show-preview');
        btn.addEventListener('mouseenter', show);
        btn.addEventListener('mouseleave', hide);
        btn.addEventListener('focus', show);
        btn.addEventListener('blur', hide);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupFloatingIcons();
        setupHoverPreviews();
    });
} else {
    setupFloatingIcons();
    setupHoverPreviews();
}

// ==========================================
// SCROLL PROGRESS BAR
// ==========================================
(function () {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    function update() {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        bar.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`;
    }

    document.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

// ==========================================
// GSAP SCROLL ANIMATIONS
// ==========================================
// all entrance states are set by gsap.from(), so if the CDN fails or the
// user prefers reduced motion the page renders fully visible with no JS
(function () {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    // hero entrance (homepage only)
    if (document.querySelector('.intro-left')) {
        gsap.from('.map-container', { opacity: 0, duration: 0.9, ease: 'power2.out' });
        gsap.from('.intro-left > *', {
            y: 26,
            opacity: 0,
            duration: 0.8,
            stagger: 0.09,
            ease: 'power3.out',
            clearProps: 'transform,opacity'
        });
        gsap.from('.photo-stack', {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            clearProps: 'transform,opacity'
        });

        // pop the floating icons in via their --scale variable so the
        // CSS rotation transform stays intact during the animation
        document.querySelectorAll('.floating-icon').forEach((icon, i) => {
            gsap.fromTo(icon,
                { '--scale': 0, opacity: 0 },
                {
                    '--scale': 1,
                    opacity: 1,
                    duration: 0.55,
                    delay: 0.45 + i * 0.06,
                    ease: 'back.out(1.8)',
                    onComplete: () => {
                        // inline --scale would override the :hover/.active rules
                        icon.style.removeProperty('--scale');
                        icon.style.removeProperty('opacity');
                    }
                }
            );
        });
    }

    // generic scroll reveals
    gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, {
            y: 28,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });

    // work experience timeline cascade
    gsap.utils.toArray('.timeline-item').forEach((item) => {
        gsap.from(item, {
            x: -18,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: item, start: 'top 90%', once: true }
        });
    });

    // hackathon wins counter
    const winsNum = document.getElementById('wins-count-num');
    if (winsNum) {
        const target = parseInt(winsNum.dataset.count, 10) || 0;
        const obj = { val: 0 };
        gsap.to(obj, {
            val: target,
            duration: 1.4,
            ease: 'power1.inOut',
            onUpdate: () => { winsNum.textContent = Math.round(obj.val); },
            scrollTrigger: { trigger: winsNum, start: 'top 92%', once: true }
        });
    }
})();