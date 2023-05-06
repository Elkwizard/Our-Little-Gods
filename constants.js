width = 1600;
height = 900;
const HORIZONTAL_PLAYER_SPEED = 8;
const JUMP_VELOCITY = 12;
const PIXEL_SIZE = 3;

const pixelRound = x => Math.round(x / PIXEL_SIZE) * PIXEL_SIZE;
const drawPixelAligned = (renderer, draw) => { 
	renderer.save();
	
	const transform = renderer.transform;
	transform[6] = pixelRound(transform[6] - canvas.width / 2) + canvas.width / 2;
	transform[7] = pixelRound(transform[7] - canvas.height / 2) + canvas.height / 2;
	renderer.transform = transform;

	draw();
	
	renderer.restore();
}

const mod = (a, b) => (a % b + b) % b;

function isDebug() {
	return false;
}