document.addEventListener('DOMContentLoaded', () => {
    const gameFrame = document.getElementById('game-frame');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const refreshBtn = document.getElementById('refresh-game-btn');

    // Get the game URL from the query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const gameUrl = urlParams.get('game');

    if (gameUrl) {
        gameFrame.src = gameUrl;
    } else {
        document.querySelector('.play-container').innerHTML = '<h1>No game specified.</h1>';
    }

    // Fullscreen button functionality
    fullscreenBtn.addEventListener('click', () => {
        if (gameFrame.requestFullscreen) {
            gameFrame.requestFullscreen();
        } else if (gameFrame.mozRequestFullScreen) { /* Firefox */
            gameFrame.mozRequestFullScreen();
        } else if (gameFrame.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            gameFrame.webkitRequestFullscreen();
        } else if (gameFrame.msRequestFullscreen) { /* IE/Edge */
            gameFrame.msRequestFullscreen();
        }
    });

    // Refresh game button functionality
    refreshBtn.addEventListener('click', () => {
        if (gameUrl) {
            // Save current scroll position
            const currentScroll = gameFrame.contentWindow.pageYOffset || 0;

            // Reload the game by setting src to empty then back to gameUrl
            gameFrame.src = '';
            setTimeout(() => {
                gameFrame.src = gameUrl;
            }, 100);
        }
    });
});
