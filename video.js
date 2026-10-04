// Story videos play only while they are on screen, so they never all run at once.
const storyVideos = document.querySelectorAll("video[data-play-in-view]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => {
                    // Autoplay can be blocked (e.g. low-power mode); the controls still work.
                });
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.6 });

    storyVideos.forEach(video => observer.observe(video));
}
