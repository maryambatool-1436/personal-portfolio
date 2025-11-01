document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Theme Toggle (Assignment Requirement) ---
    const themeToggleBtn = document.getElementById("theme-toggle");
    const toggleIcon = themeToggleBtn.querySelector("i");
    const body = document.body;

    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "light-mode") {
        body.classList.add("light-mode");
        toggleIcon.classList.replace("fa-sun", "fa-moon");
    } else {
        body.classList.add("dark-mode");
        toggleIcon.classList.replace("fa-moon", "fa-sun");
    }

    themeToggleBtn.addEventListener("click", () => {
        body.classList.toggle("light-mode");
        body.classList.toggle("dark-mode");

        let theme = "dark-mode";
        if (body.classList.contains("light-mode")) {
            theme = "light-mode";
            toggleIcon.classList.replace("fa-sun", "fa-moon");
        } else {
            toggleIcon.classList.replace("fa-moon", "fa-sun");
        }
        localStorage.setItem("theme", theme);
        // Re-draw canvas on theme change
        if (window.drawParticles) window.drawParticles();
    });

    // --- 2. Smooth Scroll (Assignment Requirement) ---
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // --- 3. Scroll-Reveal Animation ---
    const sectionsToFade = document.querySelectorAll(".fade-in-on-scroll");
    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15 }
    );
    sectionsToFade.forEach((section) => observer.observe(section));

    // --- 4. 3D Project Card Tilt Animation ---
    const projectCards = document.querySelectorAll(".project-card");

    projectCards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotateX = (y / rect.height) * -10;
            const rotateY = (x / rect.width) * 10;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
        });
    });

    // --- 5. Hero Particle Canvas Animation ---
    const canvas = document.getElementById("particle-canvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let particles = [];

        // **NEW:** Mouse object
        const mouse = {
            x: null,
            y: null,
            radius: 120, // Interaction radius around the cursor
        };

        // **NEW:** Mouse move listener
        window.addEventListener("mousemove", (event) => {
            mouse.x = event.clientX;
            // Adjust for canvas position relative to viewport
            mouse.y = event.clientY - canvas.getBoundingClientRect().top;
        });
        // **NEW:** Reset mouse position when leaving canvas
        canvas.addEventListener("mouseleave", () => {
            mouse.x = null;
            mouse.y = null;
        });

        const setupCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        };

        const getThemeColor = () => {
            return document.body.classList.contains("light-mode")
                ? "rgba(0, 123, 255, 0.5)"
                : "rgba(0, 255, 255, 0.5)";
        };

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 2 + 1;
                this.baseX = this.x; // **NEW:** Remember original spot
                this.baseY = this.y;
                this.density = Math.random() * 30 + 1; // How fast it moves
            }

            update() {
                // **UPDATED:** Particle movement
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;

                // Calculate force
                let force = (maxDistance - distance) / maxDistance;
                if (force < 0) force = 0;

                let directionX = forceDirectionX * force * this.density * 0.6; // Repel force
                let directionY = forceDirectionY * force * this.density * 0.6;

                // If mouse is near, repel
                if (distance < mouse.radius) {
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    // If mouse is far, return to base
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 10;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 10;
                    }
                }
            }

            draw() {
                ctx.fillStyle = getThemeColor();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            let numberOfParticles = (canvas.width * canvas.height) / 5000;
            for (let i = 0; i < numberOfParticles; i++) {
                let x = Math.random() * canvas.width;
                let y = Math.random() * canvas.height;
                particles.push(new Particle(x, y));
            }
        };

        const connectParticles = () => {
            let opacity;
            for (let a = 0; a < particles.length; a++) {
                // Connect particles to each other
                for (let b = a + 1; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        opacity = 1 - distance / 100;
                        ctx.strokeStyle = getThemeColor().replace(
                            "0.5",
                            opacity
                        );
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }

                // **NEW:** Connect particles to mouse
                if (mouse.x && mouse.y) {
                    let dx = particles[a].x - mouse.x;
                    let dy = particles[a].y - mouse.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouse.radius - 20) {
                        // Connect in a slightly smaller radius
                        opacity = 1 - distance / (mouse.radius - 20);
                        ctx.strokeStyle = getThemeColor().replace(
                            "0.5",
                            opacity
                        );
                        ctx.lineWidth = 0.8; // Make mouse lines thicker
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update(); // Update position based on mouse
                p.draw();
            });
            connectParticles(); // Draw lines
            requestAnimationFrame(animateParticles);
        };

        const redrawAll = () => {
            setupCanvas();
            initParticles();
        };

        // Make it globally accessible for theme toggle
        window.drawParticles = redrawAll;

        window.addEventListener("resize", redrawAll);

        redrawAll(); // Initial setup
        animateParticles(); // Start animation loop
    }
});
