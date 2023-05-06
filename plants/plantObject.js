class PLANT_OBJECT extends ElementScript {
	init(obj, player, plant) {
		obj.scripts.removeDefault();
		this.plant = plant;
		this.player = player;
		obj.defaultShape = this.plant.getBoundingBox(0, 0);
		this.centerOfMass = obj.getBoundingBox().middle;
		// console.log(obj.defaultShape);
	}
	update(obj) {

		const { position: { x, y } } = this.player.transform;
		const dx = this.centerOfMass.x - x;
		const dy = this.centerOfMass.y - y;
		const wind = 0.5 * Math.sign(dx) * Math.min(1, 1000 / (dx ** 2 + dy ** 2));
						
		applyWind(Random, this.plant, wind);
	}
	draw(obj, name, shape) {
		gl.transform = renderer.transform;
		this.plant.render(gl, 0, 0);
	}
	static create(x, y, player, plant) {
		const object = scene.main.addRectElement("object", x, y, 1, 1, new Controls("w", "s", "a", "d"), "No Tag");
		object.scripts.add(PLANT_OBJECT, player, plant);
		return object;
	}
}