document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');

    fetch('./Data/games.json')
        .then(response => response.json())
        .then(data => {
            data.games.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.classList.add('game-card');

                // Check if the file is an external URL
                const isExternalUrl = game.file.startsWith('http://') || game.file.startsWith('https://');

                const gameLink = document.createElement(isExternalUrl ? 'a' : 'a');
                gameLink.href = isExternalUrl ? game.file : `play.html?game=${encodeURIComponent(game.file)}`;
                gameLink.target = isExternalUrl ? '_blank' : '_self';
                gameLink.rel = isExternalUrl ? 'noopener noreferrer' : '';

                const gameTitle = document.createElement('h3');
                gameTitle.textContent = game.name;

                if (game.image) {
                    const gameImage = document.createElement('img');
                    gameImage.src = game.image;
                    gameImage.alt = game.name;
                    gameLink.appendChild(gameImage);
                } else {
                    gameCard.classList.add('no-image');
                }

                gameLink.appendChild(gameTitle);
                gameCard.appendChild(gameLink);
                gameContainer.appendChild(gameCard);
            });
        })
        .catch(error => {
            console.error('Error loading game data:', error);
            gameContainer.innerHTML = '<p>Could not load game data. Please try again later.</p>';
        });
});