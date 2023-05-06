title = "Our Little Gods";

const messages = new MessageManager(new Font(40, "Fira Sans Condensed"));

let progress = 0;
// messages.displayMessage(getStorySentence(progress));

const player = PLAYER.create(width / 2, height / 2, new Controls("w", "s", "a", "d", "j"), () => {
	world.scripts.WORLD.openArena();
	player.scripts.PLAYER.respawn();
	us.scripts.US.resetPhase();
});

const us = US.create(width * 1.5, height * 0.8 - US.HEIGHT / 2, player, messages, () => {
	world.scripts.WORLD.openArena();
});

const world = WORLD.create(player, () => {
	player.scripts.PLAYER.restore();
	us.scripts.US.nextPhase();
	if (!us.scripts.US.nostalgic)
		world.scripts.WORLD.closeArena();
});

// for (let i = 0; i < 5; i++) {
// 	DUMMY.create(Random.range(200, world.width - 200), 200);
// }


intervals.continuous(time => {
	// day-night cycle
	postProcess();

	messages.showCurrentMessage();

	if (keyboard.justPressed(" "))
		messages.nextMessage();

	// if (keyboard.justPressed("Enter")) {
	// 	messages.displayMessage(getStorySentence(progress));
	// 	progress += 0.05;
	// }
}, IntervalFunction.AFTER_UPDATE);