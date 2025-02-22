const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const rows = 10; // Fixed number of rows
const cols = 10; // Fixed number of columns
let tileSize; // Tile size to be calculated based on screen size

let hamster = { x: 0, y: 0, direction: 'right' };
let maze = [];
let level = 1;
let speed = 500;  // Initial speed in milliseconds
let goal = { x: cols - 1, y: rows - 1 };

let score = 0;
const scoreElement = document.getElementById('score');
const squeakSound = new Audio('squeak.mp3');
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.5; // Adjust volume

const startButton = document.getElementById('startButton');

const hamsterImage = new Image();
hamsterImage.src = 'hamster.png';
const wallImage = new Image();
wallImage.src = 'walls.png';
const goalImage = new Image();
goalImage.src = 'cheese.png';

let imagesLoaded = 0;
const totalImages = 3;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        startButton.disabled = false;
    }
}

hamsterImage.onload = imageLoaded;
wallImage.onload = imageLoaded;
goalImage.onload = imageLoaded;

startButton.addEventListener('click', () => {
    backgroundMusic.play();
    startButton.style.display = 'none'; // Hide the start button
    startGame();
});

function createMaze() {
    // Initialize the maze with all walls
    maze = Array.from({ length: rows }, () => Array(cols).fill(1));

    // Ensure the first 5 squares are clear
    for (let i = 0; i < 5; i++) {
        maze[0][i] = 0;
    }

    // Start the maze generation from the end of the clear path
    carvePassagesFrom(0, 5);

    // Ensure the goal position is clear
    maze[rows - 1][cols - 1] = 0;
}

function carvePassagesFrom(row, col) {
    const directions = shuffle(['up', 'down', 'left', 'right']);

    directions.forEach(direction => {
        const [nextRow, nextCol] = getNextCell(row, col, direction);
        const [betweenRow, betweenCol] = getNextCell(row, col, direction, true);

        if (isValidCell(nextRow, nextCol) && maze[nextRow][nextCol] === 1) {
            maze[row][col] = 0;
            maze[betweenRow][betweenCol] = 0; // Clear the wall between
            maze[nextRow][nextCol] = 0;
            carvePassagesFrom(nextRow, nextCol);
        }
    });
}

function getNextCell(row, col, direction, between = false) {
    switch (direction) {
        case 'up': return [row - (between ? 1 : 2), col];
        case 'down': return [row + (between ? 1 : 2), col];
        case 'left': return [row, col - (between ? 1 : 2)];
        case 'right': return [row, col + (between ? 1 : 2)];
    }
}

function isValidCell(row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (maze[row][col] === 1) {
                ctx.drawImage(wallImage, col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawHamster() {
    const centerX = hamster.x * tileSize + tileSize / 2;
    const centerY = hamster.y * tileSize + tileSize / 2;
    ctx.save();
    ctx.translate(centerX, centerY);

    switch (hamster.direction) {
        case 'right':
            ctx.rotate(0);
            break;
        case 'down':
            ctx.rotate(Math.PI / 2);
            break;
        case 'left':
            ctx.scale(-1, 1); // Flip horizontally
            break;
        case 'up':
            ctx.rotate(-Math.PI / 2);
            break;
    }

    ctx.drawImage(hamsterImage, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
    ctx.restore();
}

function drawGoal() {
    ctx.drawImage(goalImage, goal.x * tileSize, goal.y * tileSize, tileSize, tileSize);
}

function moveHamster() {
    const previousX = hamster.x;
    const previousY = hamster.y;

    if (hamster.direction === 'right') hamster.x++;
    else if (hamster.direction === 'left') hamster.x--;
    else if (hamster.direction === 'up') hamster.y--;
    else if (hamster.direction === 'down') hamster.y++;

    // Check if hamster hits the border
    if (hamster.x >= cols || hamster.x < 0 || hamster.y >= rows || hamster.y < 0) {
        hamster.x = previousX;
        hamster.y = previousY;
    }

    if (maze[hamster.y][hamster.x] === 1) {
        squeakSound.play();
        backgroundMusic.pause();
        alert(`Game Over! You hit a wall. Your score: ${score}`);
        hamster = { x: 0, y: 0, direction: 'right' };
        level = 1;
        speed = 500;
        score = 0; // Reset score
        updateScore();
        createMaze();
        backgroundMusic.currentTime = 0; // Reset music
    }

    if (hamster.x === goal.x && hamster.y === goal.y) {
        alert('Level Complete!');
        level++;
        speed = speed * 0.9; // Increase speed by 10%
        hamster = { x: 0, y: 0, direction: 'right' };
        createMaze();
    }
}

function updateScore() {
    score += Math.floor(10 * (500 / speed));
    scoreElement.textContent = `Score: ${score}`;
}

function update() {
    moveHamster();
    drawMaze();
    drawGoal();
    drawHamster();
    updateScore();
}

// Swipe detection for mobile devices
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            hamster.direction = 'right';
        } else {
            hamster.direction = 'left';
        }
    } else {
        if (deltaY > 0) {
            hamster.direction = 'down';
        } else {
            hamster.direction = 'up';
        }
    }
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') hamster.direction = 'right';
    else if (event.key === 'ArrowLeft') hamster.direction = 'left';
    else if (event.key === 'ArrowUp') hamster.direction = 'up';
    else if (event.key === 'ArrowDown') hamster.direction = 'down';
});

function startGame() {
    backgroundMusic.play();
    createMaze();
    setInterval(update, speed);
}

// Resize canvas based on screen size while maintaining maze size
function resizeCanvas() {
    const minDimension = Math.min(window.innerWidth, window.innerHeight);
    tileSize = Math.floor(minDimension / Math.max(rows, cols));
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
}

// Initial scaling
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
