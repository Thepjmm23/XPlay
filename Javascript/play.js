document.addEventListener('DOMContentLoaded', () => {
    const gameFrame = document.getElementById('game-frame');
    const fullscreenBtn = document.getElementById('fullscreen-btn');

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
});
