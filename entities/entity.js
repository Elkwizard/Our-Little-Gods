class ENTITY extends ElementScript {
	init(obj, invincibilityFrames, health = Infinity) {
		this.health = health;
		this.invincibilityFrames = invincibilityFrames;
		this.stunTimer = 0;
		this.onHit = [];
	}
	set health(a) {
		this._health = Math.max(0, a);
	}
	get health() {
		return this._health;
	}
	get invincible() {
		return this.stunTimer > 0;
	}
	get stunBlink() {
		return this.stunTimer > 0 && Math.sin(this.stunTimer * 0.5) > 0;
	}
	get dead() {
		return this.health === 0;
	}
	hit(obj, attack) {
		if (!this.invincible) {
			this.stunTimer = this.invincibilityFrames;
			this.health -= attack.damage;
			for (const fn of this.onHit)
				fn(attack);
		}
	}
	update(obj) {
		this.stunTimer--;
		if (this.stunTimer <= 0)
			this.stunTimer = 0;
	}
	draw(obj, name, shape) {
		// renderer.stroke(Color.CYAN, 4).circle(0, 0, 100);
	}
}