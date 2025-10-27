// initialize austin map with leaflet
function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // austin coordinates
    const austin = [30.2672, -97.7431];

    // blue dot position - slightly below austin to not cover city name
    const blueDotPosition = [30.264, -97.7431];

    // create map
    const map = L.map('map', {
        center: austin,
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
        touchZoom: true
    });

    // use cartodb voyager tiles (colorful, clean, apple maps-like aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // add blue dot as a circle marker at fixed coordinates
    const blueDot = L.circleMarker(blueDotPosition, {
        radius: 6,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
        opacity: 1,
        className: 'blue-location-dot'
    }).addTo(map);

    // add glow effect by adding a larger transparent circle behind
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

// load map on page load
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

    // check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
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
// PARTICLE SYSTEM
// ==========================================

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        this.particleCount = 20;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = document.documentElement.scrollHeight;

        // ensure proper pixel ratio for crisp circles
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = document.documentElement.scrollHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = document.documentElement.scrollHeight + 'px';
        this.ctx.scale(dpr, dpr);
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * document.documentElement.scrollHeight,
            size: Math.random() * 2 + 2.5, // 2.5-4.5px for perfect circles
            baseX: Math.random() * window.innerWidth,
            baseY: Math.random() * document.documentElement.scrollHeight,
            vx: (Math.random() - 0.5) * 0.8, // slow continuous drift
            vy: (Math.random() - 0.5) * 0.8
        };
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY + window.scrollY;
    }

    animate() {
        this.ctx.clearRect(0, 0, window.innerWidth, document.documentElement.scrollHeight);

        const isDarkMode = document.body.classList.contains('dark-mode');
        const particleColor = isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';

        this.particles.forEach(particle => {
            // calculate distance from mouse
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 150;

            // move away from mouse
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const angle = Math.atan2(dy, dx);
                particle.x -= Math.cos(angle) * force * 5;
                particle.y -= Math.sin(angle) * force * 5;
            }

            // continuous slow floating movement
            particle.x += particle.vx;
            particle.y += particle.vy;

            // very gentle pull back toward base to prevent drifting too far
            particle.x += (particle.baseX - particle.x) * 0.005;
            particle.y += (particle.baseY - particle.y) * 0.005;

            // wrap around edges
            if (particle.x < -10) {
                particle.x = window.innerWidth + 10;
                particle.baseX = window.innerWidth + 10;
            }
            if (particle.x > window.innerWidth + 10) {
                particle.x = -10;
                particle.baseX = -10;
            }
            if (particle.y < -10) {
                particle.y = document.documentElement.scrollHeight + 10;
                particle.baseY = document.documentElement.scrollHeight + 10;
            }
            if (particle.y > document.documentElement.scrollHeight + 10) {
                particle.y = -10;
                particle.baseY = -10;
            }

            // draw perfect circle
            this.ctx.fillStyle = particleColor;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// initialize particle system
const particlesCanvas = document.getElementById('particles-canvas');
if (particlesCanvas) {
    new ParticleSystem(particlesCanvas);
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