const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);

function arenaSweep() {

    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0)
                continue outer;
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {    //traverse row
        for (let x = 0; x < m[y].length; ++x) {      //traverse column
            if (m[y][x] !== 0 &&    //player matrix is not 0
                (arena[y + o.y] &&  //arena row exists (player within height of drop)
                    arena[y + o.y][x + o.x]) !== 0)//arena already has entry at given positio !0
            {
                return true;         //collision has occured
            }

        }
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return ([
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0]
        ])
    } else if (type === 'O') {
        return ([
            [2, 2],
            [2, 2]
        ])
    } else if (type === 'L') {
        return ([
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3]
        ])
    } else if (type === 'J') {
        return ([
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0]
        ])
    } else if (type === 'I') {
        return ([
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0]
        ])
    } else if (type === 'S') {
        return ([
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0]
        ])
    } else if (type === 'Z') {
        return ([
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ])
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(player.matrix, player.pos);
    drawMatrix(arena, { x: 0, y: 0 });
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                    y + offset.y,
                    1, 1);
            }
        });
    });
}


function merge(arena, player) {       //cpoies values from player to arena
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value != 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;    //offset from player dertermines position in arena matrix
            }
        });
    });
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    //  rotating at edges moves piece in x dir
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;   //tries moving in right first
        offset = -(offset + (offset > 0 ? 1 : -1))  //if still collides changes offset dir in advance for next try
        if (offset > player.matrix[0].length) {    //to exit while
            rotate(player.matrix, -dir);        //return mat to normal
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [                       //tuple switch row interchange rows and columns
                matrix[x][y],
                matrix[y][x]
            ] = [
                    matrix[y][x],
                    matrix[x][y]
                ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }

}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;     //bring back in arena
        merge(arena, player);    //merge with record
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;      //reset counter or piece keeps falling
}

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;      //update last_time to time
    //console.log(deltaTime);
    dropCounter += deltaTime;
    if (dropCounter > dropInterval)    //counter keeps track of time to drop piece every second 
    {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score
}

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

const arena = createMatrix(12, 20);

document.addEventListener('keydown', event => {
    if (event.keyCode == 37) {//console.log('left');
        playerMove(-1);
    }
    else if (event.keyCode === 39) {//'right'   triple equal identity equals doesn't convert types brfore check
        playerMove(1);
    }
    else if (event.keyCode == 40) {
        playerDrop();
    }
    else if (event.keyCode === 81) {
        playerRotate(-1);
    }
    else if (event.keyCode === 87) {
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();