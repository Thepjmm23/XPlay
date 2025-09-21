document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    let columns = [];

    const mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('click', (event) => {
        if (localStorage.getItem('clickEffect') !== 'true') return;
        
        const themeName = localStorage.getItem('theme') || 'space';
        const themeColor = themes[themeName]?.color || '#fff';

        for (let i = 0; i < 20; i++) {
            particles.push({
                x: event.x,
                y: event.y,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 100,
                color: themeColor
            });
        }
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if ((localStorage.getItem('theme') || 'space') === 'hacking') {
            const fontSize = 16;
            const numColumns = Math.floor(canvas.width / fontSize);
            columns = Array(numColumns).fill(1);
        }
    }
    window.addEventListener('resize', resizeCanvas);

    const themes = {
        space: {
            color: '#fff',
            init: () => {
                particles = [];
                const numStars = 500;
                for (let i = 0; i < numStars; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        radius: Math.random() * 1.5,
                        baseX: Math.random() * canvas.width,
                        baseY: Math.random() * canvas.height,
                        density: (Math.random() * 30) + 1
                    });
                }
            },
            animate: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = themes.space.color;
                particles.forEach((p, i) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();

                    if (p.life) {
                        p.life--;
                        if (p.life <= 0) particles.splice(i, 1);
                        p.x += p.vx;
                        p.y += p.vy;
                    } else {
                        const mouseInteraction = localStorage.getItem('mouseInteraction') || 'off';
                        if (mouseInteraction !== 'off') {
                            const dx = mouse.x - p.x;
                            const dy = mouse.y - p.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < mouse.radius) {
                                const forceDirectionX = dx / distance;
                                const forceDirectionY = dy / distance;
                                const force = (mouse.radius - distance) / mouse.radius;
                                const directionX = forceDirectionX * force * p.density;
                                const directionY = forceDirectionY * force * p.density;
                                if (mouseInteraction === 'push') {
                                    p.x -= directionX;
                                    p.y -= directionY;
                                } else { // pull
                                    p.x += directionX;
                                    p.y += directionY;
                                }
                            }
                        }
                    }
                });
            }
        },
        hacking: {
            color: '#0f0',
            init: () => resizeCanvas(),
            animate: () => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = themes.hacking.color;
                const fontSize = 16;
                ctx.font = fontSize + 'px monospace';

                columns.forEach((y, x) => {
                    const text = Math.random() < 0.5 ? '0' : '1';
                    ctx.fillText(text, x * fontSize, y * fontSize);

                    const mouseInteraction = localStorage.getItem('mouseInteraction') || 'off';
                    if (mouseInteraction !== 'off' && mouse.x && mouse.y) {
                        const dx = (x * fontSize) - mouse.x;
                        const dy = (y * fontSize) - mouse.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < mouse.radius / 2) {
                            if (mouseInteraction === 'push') {
                                columns[x] = y + 10;
                            } else {
                                columns[x] = y - 10;
                            }
                        }
                    }

                    if (y * fontSize > canvas.height && Math.random() > 0.975) {
                        columns[x] = 0;
                    }
                    columns[x]++;
                });
            }
        },
        ocean: {
            color: '#7FDBFF',
            init: () => {
                particles = [];
                const numBubbles = 100;
                for (let i = 0; i < numBubbles; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: canvas.height + Math.random() * canvas.height,
                        radius: Math.random() * 10 + 2,
                        vy: -(Math.random() * 2 + 1),
                        vx: (Math.random() - 0.5) * 0.5
                    });
                }
            },
            animate: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p, i) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(127, 219, 255, 0.5)';
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(127, 219, 255, 0.2)';
                    ctx.fill();

                    if (p.life) {
                        p.life--;
                        if (p.life <= 0) particles.splice(i, 1);
                        p.x += p.vx;
                        p.y += p.vy;
                    } else {
                        p.y += p.vy;
                        p.x += p.vx;
                        if (p.y < -p.radius) {
                            p.y = canvas.height + p.radius;
                            p.x = Math.random() * canvas.width;
                        }
                    }
                });
            }
        }
    };

    function startAnimation(themeName) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const theme = themes[themeName] || themes.space;
        theme.init();
        function loop() {
            theme.animate();
            animationFrameId = requestAnimationFrame(loop);
        }
        loop();
    }

    resizeCanvas();
    startAnimation(localStorage.getItem('theme') || 'space');

    window.addEventListener('storage', (e) => {
        if (e.key === 'theme' || e.key === 'mouseInteraction') startAnimation(localStorage.getItem('theme') || 'space');
    });
});