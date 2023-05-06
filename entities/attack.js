class ATTACK extends ElementScript {
	init(obj, source, direction, radius, {
		duration = 20,
		force = 20000,
		color = Color.WHITE,
		damage = 1,
		angleSpread = Math.PI * 0.8
	}) {
		obj.scripts.removeDefault();
		this.direction = direction;
		this.radius = radius;
		this.duration = duration;
		this.timer = this.duration;
		this.source = source;
		this.force = force;
		this.color = color;
		this.damage = damage;
		this.rb = obj.scripts.PHYSICS;
		this.rb.isTrigger = true;

		this.angleSpread = angleSpread;
		const { angle } = this.direction;
		const off = this.direction.x < 0 ? -this.angleSpread / 2 : this.angleSpread / 2;
		this.startAngle = angle - off;
		this.endAngle = angle + off;
	}
	collideRule(obj, other) {
		return other !== this.source;
	}
	collideGeneral(obj, { element, direction }) {
		if (element.scripts.has(ENTITY)) {
			// hit
			const contact = element.getModel("default").closestPointTo(obj.transform.position);
			element.scripts.PHYSICS.applyImpulse(contact, this.direction.times(this.force));
			this.source.scripts.PHYSICS.applyImpulse(contact, this.direction.times(-this.force * 1.3));
			element.scripts.ENTITY.hit(this);
		}
	}
	update(obj) {
		this.timer--;
		if (this.timer <= 0)
			obj.remove();
	}
	draw(obj, name, shape) {

		const t = 1 - this.timer / this.duration;
		const beginT = t < 0.5 ? 0 : t * 2 - 1;
		const endT = t < 0.5 ? t * 2 : 1;
		// const begin = Number.remap(beginT, 0, 1, this.startAngle, this.endAngle);
		// const end = Number.remap(endT, 0, 1, this.startAngle, this.endAngle);
		
		const STEPS = 20;
		let last = null;

		const maxLineWidth = 30;

		for (let i = 0; i < STEPS; i++) {
			const angleT = Number.remap(i, 0, STEPS - 1, beginT, endT);
			const angle = Number.remap(angleT, 0, 1, this.startAngle, this.endAngle);
			const lw = maxLineWidth * Math.sin(Math.PI * (angleT - beginT));
			const point = Vector2.fromAngle(angle).times(this.radius - maxLineWidth / 2);
			if (last)
				renderer.stroke(this.color, lw, LineCap.ROUND).line(last, point);
			last = point;
		}
	}
	static create(source, location, direction, radius, options) {
		const attack = scene.main.addPhysicsCircleElement("attack", location.x, location.y, radius, false, new Controls("w", "s", "a", "d"), "No Tag");
		attack.scripts.add(ATTACK, source, direction, radius, options);
		return attack;
	}
}