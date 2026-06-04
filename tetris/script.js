const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; // 300 / 10

context.scale(BLOCK_SIZE, BLOCK_SIZE);

// Neon colors for each piece
const COLORS = [
    null,
    '#00ffff', // I - Cyan
    '#0000ff', // J - Blue
    '#ff7f00', // L - Orange
    '#ffff00', // O - Yellow
    '#00ff00', // S - Green
    '#800080', // T - Purple
    '#ff0000'  // Z - Red
];

// Tetromino definitions
const PIECES = [
    [],
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    [
        [4, 4],
        [4, 4]
    ],
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

let board = createMatrix(COLS, ROWS);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Neon glow effect
                context.shadowBlur = 10;
                context.shadowColor = COLORS[value];
                context.fillStyle = COLORS[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Inner highlight
                context.shadowBlur = 0;
                context.fillStyle = 'rgba(255, 255, 255, 0.4)';
                context.fillRect(x + offset.x + 0.1, y + offset.y + 0.1, 0.8, 0.8);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.shadowBlur = 0;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(board, {x: 0, y: 0});
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(board, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function sweep() {
    let rowCount = 1;
    outer: for (let y = board.length - 1; y >= 0; --y) {
        for (let x = 0; x < board[y].length; ++x) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        ++y;
        
        player.score += rowCount * 100;
        rowCount *= 2;
    }
    scoreElement.innerText = player.score;
}

function playerDrop() {
    if (!player.matrix) return;
    player.pos.y++;
    if (collide(board, player)) {
        player.pos.y--;
        merge(board, player);
        playerReset();
        sweep();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(board, player)) {
        player.pos.x -= offset;
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(board, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const typeId = Math.floor(Math.random() * 7) + 1;
    player.matrix = PIECES[typeId].map(row => [...row]); 
    player.pos.y = 0;
    player.pos.x = Math.floor(board[0].length / 2) - Math.floor(player.matrix[0].length / 2);
    
    if (collide(board, player)) {
        board.forEach(row => row.fill(0));
        player.score = 0;
        scoreElement.innerText = player.score;
        isPlaying = false;
        player.matrix = null;
        startBtn.innerText = 'START';
        draw();
        setTimeout(() => alert('GAME OVER! SCORE: ' + player.score), 10);
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPlaying = false;
let animationId;

function update(time = 0) {
    if (!isPlaying) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
    draw();
    animationId = requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!isPlaying) return;
    
    // Prevent default scrolling for arrow keys
    if([37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }
    
    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down
            playerDrop();
            break;
        case 38: // Up
            playerRotate(1);
            break;
    }
});

startBtn.addEventListener('click', () => {
    if (isPlaying) {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        startBtn.innerText = 'RESUME';
    } else {
        if (!player.matrix) {
            board.forEach(row => row.fill(0));
            playerReset();
            player.score = 0;
            scoreElement.innerText = '0';
        }
        isPlaying = true;
        startBtn.innerText = 'PAUSE';
        lastTime = performance.now();
        update();
        canvas.focus(); // Focus canvas after starting
    }
});

draw();
