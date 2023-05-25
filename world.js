class GATE extends ElementScript {
	static WIDTH = 40;
	static HEIGHT = 400;
	init(obj) {
		obj.scripts.removeDefault();
		this.baseline = obj.transform.position.y;
		this.target = this.baseline;
		this.lower();
		this.displayed = this.target;
		this.image = loadResource("gate.png");
		obj.layer = -20;
	}
	lower(obj) {
		this.target = this.baseline + obj.height;
		obj.transform.position.y = this.target;
	}
	raise(obj) {
		this.target = this.baseline;
		obj.transform.position.y = this.target;
	}
	update(obj) {
		this.displayed += 0.05 * (this.target - this.displayed);
	}
	draw(obj, name, shape) {
		// renderer.draw(Color.BLUE).infer(shape);
		obj.transform.drawInGlobalSpace(() => {
			renderer.image(this.image).rect(
				shape.center(new Vector2(obj.transform.position.x, this.displayed))
			);
		}, renderer);
	}
	static create(x, y) {
		const gate = scene.main.addPhysicsRectElement("gate", x, y - GATE.HEIGHT / 2, GATE.WIDTH, GATE.HEIGHT, false, new Controls("w", "s", "a", "d"), "No Tag");
		gate.scripts.add(GATE);
		return gate;
	}
}

class ARENA extends ElementScript {
	init(obj, onEnter) {
		obj.scripts.removeDefault();
		this.rb = obj.scripts.PHYSICS;
		this.rb.isTrigger = true;
		this.containsPlayer = false;
		const box = obj.getBoundingBox();
		this.leftGate = GATE.create(box.min.x - GATE.WIDTH, box.max.y);
		this.rightGate = GATE.create(box.max.x + GATE.WIDTH, box.max.y);
		this.onEnter = onEnter;
		this.open();
	}
	open(obj) {
		this.leftGate.scripts.GATE.lower();
		this.rightGate.scripts.GATE.lower();
	}
	close(obj) {
		this.leftGate.scripts.GATE.raise();
		this.rightGate.scripts.GATE.raise();
	}
	update(obj) {
		const { rb } = this;
		const contains = rb.colliding.test(({ element }) => element.scripts.has(PLAYER));
		if (!this.containsPlayer && contains)
			this.onEnter();
		this.containsPlayer = contains;
	}
	draw(obj, name, shape) {
		// renderer.draw(this.containsPlayer ? Color.LIME : Color.CYAN).infer(shape);
	}
}

class PLATFORM extends ElementScript {
	static WIDTH = 300;
	static HEIGHT = 51;
	init(obj) {
		obj.scripts.removeDefault();
		obj.layer = -5;
		this.image = loadResource("platform.png");
	}
	collideRule(obj, element) {
		return !element.scripts.has(US) && !element.scripts.has(BLAST) && !element.scripts.has(ARM_SEGMENT);
	}
	update(obj) {
		
	}
	draw(obj, name, shape) {
		renderer.image(this.image).rect(shape);
	}
	static create(x, y) {
		const platform = scene.main.addPhysicsRectElement("platform", x, y, PLATFORM.WIDTH, PLATFORM.HEIGHT, false, new Controls("w", "s", "a", "d"), "No Tag");
		platform.scripts.add(PLATFORM);
		return platform;
	}
}

class WORLD extends ElementScript {
	init(obj, player, onArenaEnter) {
		obj.scripts.removeDefault();
		this.plants = [];
		this.player = player;

		obj.layer = -10;

		const plants = [
			[20, () => PLANT_LIBRARY.CHERRY_BLOSSOM()],
			[200, () => PLANT_LIBRARY.GRASS()],
			[40, () => PLANT_LIBRARY.DAISY()]
		];
		
		for (const [count, create] of plants) {
			for (let i = 0; i < count; i++) {
				let x = Random.range(0, width);
				if (Random.bool()) x += width * 2;
				const yOffset = Random.range(-1, 10);
				const plant = PLANT_OBJECT.create(x, height * 0.8 + yOffset, [player], create());
				plant.layer = Random.range(-5, 5);
				this.plants.push(plant);
			}
		}

		{
			const box = obj.getBoundingBox();
			const wallThickness = 50;
			this.leftWall = scene.main.addPhysicsRectElement("leftWall", box.min.x - wallThickness / 2, height / 2, wallThickness, height);
			this.rightWall = scene.main.addPhysicsRectElement("rightWall", box.max.x + wallThickness / 2, height / 2, wallThickness, height);
			this.ceiling = scene.main.addPhysicsRectElement("ceiling", box.middle.x, -wallThickness / 2, box.width, wallThickness);
			this.arenaArea = scene.main.addPhysicsRectElement("arena", box.middle.x, box.min.y / 2, width, box.min.y);
			this.arenaArea.scripts.add(ARENA, onArenaEnter);

			PLATFORM.create(box.middle.x - PLATFORM.WIDTH * 1.5, height * 0.7);
			PLATFORM.create(box.middle.x + PLATFORM.WIDTH * 1.5, height * 0.7);

			const ceilingHeight = height * 0.35;
			const ceilingWidth = width * 0.8;
			const ceilingOffsetY = height * 0.1;
			const ceilingLength = Math.hypot(ceilingWidth, ceilingHeight);
			const ceilingAngle = Math.atan2(ceilingHeight, ceilingWidth);
			const leftCeiling = scene.main.addPhysicsRectElement("leftCeiling", box.middle.x - ceilingWidth / 2, ceilingOffsetY + ceilingHeight / 2, ceilingLength, wallThickness, false, new Controls("w", "s", "a", "d"), "No Tag");
			leftCeiling.transform.rotation = -ceilingAngle;
			leftCeiling.hide();
			const rightCeiling = scene.main.addPhysicsRectElement("rightCeiling", box.middle.x + ceilingWidth / 2, ceilingOffsetY + ceilingHeight / 2, ceilingLength, wallThickness, false, new Controls("w", "s", "a", "d"), "No Tag");
			rightCeiling.transform.rotation = ceilingAngle;
			rightCeiling.hide();
		}

		this.image = loadResource("world.png");
	}
	openArena() {
		this.arenaArea.scripts.ARENA.open();
	}
	closeArena() {
		this.arenaArea.scripts.ARENA.close();
	}
	beforeUpdate(obj) {
		const { position } = this.player.transform;
		scene.camera.moveTowards(position);
		scene.camera.position = Vector2.round(scene.camera.position.over(PIXEL_SIZE)).times(PIXEL_SIZE);
		scene.camera.constrain(0, 0, obj.width, height);
	}
	update(obj) {
		
	}
	draw(obj, name, shape) {
		const box = obj.getBoundingBox();
		obj.transform.drawInGlobalSpace(() => {
			renderer.image(this.image).rect(box.min.x, 0, box.width, height);
		}, renderer);
		// renderer.draw(Color.BROWN).rect(shape);
	}
	static create(...params) {
		const WIDTH = width * 3;
		const HEIGHT = height * 0.2;
		const world = scene.main.addPhysicsRectElement("world", WIDTH / 2, height - HEIGHT / 2, WIDTH, HEIGHT, false, new Controls("w", "s", "a", "d"), "No Tag");
		world.scripts.add(WORLD, ...params);
		return world;
	}
}