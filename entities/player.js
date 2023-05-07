class PLAYER extends ElementScript {
	init(obj, onDefeat) {
		obj.scripts.removeDefault();
		this.initialPosition = obj.transform.position.get();
		this.maxHealth = 6;
		obj.scripts.add(ENTITY, 20, this.maxHealth);
		this.onDefeat = onDefeat;
		this.rb = obj.scripts.PHYSICS;
		this.attackCooldown = 0;
		this.rb.friction = 0.7;
		this.justMoving = false;
		this.stoppedTimer = 0;
		this.armAngle = 0.3;
		this.armTimer = 0;
		this.attackingTimer = 0;
		this.scheduledDefeat = false;

		this.armImage = loadResource("arm.png");
		this.idleImage = loadResource("still.png");
		this.walkAnimation = loadResource("walk");
		this.winceOverlay = loadResource("wince.png");
		this.damageOverlay = loadResource("damage.png");
		this.healthImage = loadResource("health.png");
		this.deadImage = loadResource("dead.png");

		this.frame = new Frame(this.walkAnimation.width, this.walkAnimation.height, 1);
		const pxSize = 3;
		this.frameRect = new Rect(
			-obj.width / 2 - 2 * pxSize,
			obj.height / 2 - this.frame.height * pxSize,
			this.frame.width * pxSize,
			this.frame.height * pxSize
		);
		this.armRect = new Rect(
			0, -this.armImage.height / 2,
			this.armImage.width,
			this.armImage.height
		);

		this.particles = scene.main.addElement("particles", 0, 0);
		this.particles.scripts.add(PARTICLE_SPAWNER, {
			radius: 5,
			delay: 0.1,
			falls: true,
			slows: false,
			lifeSpan: 20,
			active: false,
			init(particle) {
				particle.velocity = Vector2.fromAngle(Random.angle()).times(Random.range(5, 8));
				particle.data.color = Color.lerp(Color.BROWN, Color.RED, Random.range(0.1, 0.3));
				particle.data.orientation = Random.angle();
				particle.data.omega = Random.range(0.1, 0.2);
				particle.data.size = Random.range(5, 10);
				particle.timer -= Random.range(0.1, 0.2);
			},
			update(particle) {
				particle.data.orientation += particle.data.omega;
			},
			draw(renderer, particle) {
				const w = particle.data.size;
				const h = w * 0.2;
				renderer.save();
				renderer.translate(particle.position);
				renderer.rotate(particle.data.orientation);
				renderer.draw(particle.data.color).rect(-w / 2, -h / 2, w, h);
				renderer.restore();
			}
		});

		this.skidParticles = scene.main.addElement("skidParticles", 0, 0);
		this.skidParticles.scripts.add(PARTICLE_SPAWNER, {
			radius: 5,
			delay: 1,
			falls: false,
			slows: false,
			lifeSpan: 10,
			active: false,
			init(particle) {
				particle.data.radius = Random.range(5, 15);
				particle.timer -= Random.range(0.1, 0.2);
				particle.data.color = Color.grayScale(Random.range(0.8, 1));
			},
			update(particle) {
				
			},
			draw(renderer, particle) {
				const r = particle.data.radius * (1 - particle.timer);
				renderer.draw(particle.data.color).circle(particle.position, r);
			}
		});

		this.layer = obj.layer;
		this.respawn();
	}
	collideRule(obj, other) {
		if (obj.scripts.ENTITY.dead) {
			return !other.scripts.has(PLATFORM) && !other.scripts.has(US);
		}
		return true;
	}
	respawn(obj) {
		this.scheduledDefeat = false;
		obj.transform.position = this.initialPosition;
		obj.transform.rotation = 0;
		obj.layer = this.layer;
		this.rb.canRotate = false;
		this.rb.angularVelocity = 0;
		this.rb.velocity.mul(0);
		this.direction = 1;
		this.restore();
	}
	restore(obj) {
		obj.scripts.ENTITY.health = this.maxHealth;
		this.healthLossTimers = [];
	}
	update(obj) {
		const { rb } = this;

		if (obj.scripts.ENTITY.dead) {
			if (!this.scheduledDefeat) {
				this.particles.scripts.PARTICLE_SPAWNER.explode(20, obj.transform.position);
				this.scheduledDefeat = true;
				this.justMoving = false;
				rb.canRotate = true;
				rb.angularVelocity = -this.direction * 0.3;
				rb.velocity.mul(0);
				obj.layer = Infinity;
				intervals.delay(() => {
					this.onDefeat();
				}, 200);
			}
			return;
		}
		
		const up = keyboard.pressed(obj.controls.up);
		const left = keyboard.pressed(obj.controls.left);
		const right = keyboard.pressed(obj.controls.right);
		const down = keyboard.pressed(obj.controls.down);
		
		if (rb.colliding.bottom && keyboard.justPressed(obj.controls.up))
			rb.velocity.y = -JUMP_VELOCITY;

		const collidingDirection = rb.colliding[this.direction === -1 ? "left" : "right"];

		if (
			collidingDirection &&
			collidingDirection
				.filter(({ element }) => !element.scripts.PHYSICS.isTrigger)
				.length
		) this.stoppedTimer = 0;
		else this.stoppedTimer++;

		if (left != right) {
			this.direction = left ? -1 : 1;
			const target = this.direction * HORIZONTAL_PLAYER_SPEED;
			rb.velocity.x += 0.9 * (target - rb.velocity.x);
			this.justMoving = true;
		} else if (this.justMoving) {
			if (this.stoppedTimer > 2)
				rb.velocity.x -= this.direction * HORIZONTAL_PLAYER_SPEED;
			this.justMoving = false;
		} else if (Math.abs(rb.velocity.x) > 3 && rb.colliding.bottom) {
			const { middle, max, width } = obj.getBoundingBox();
			this.skidParticles.scripts.PARTICLE_SPAWNER.explode(1, new Vector2(
				middle.x + Math.sign(rb.velocity.x) * width / 2, max.y
			));
		}
		
		if (keyboard.justPressed(obj.controls.interact1) && this.attackCooldown <= 0) {
			const dir = up ? Vector2.up : down ? Vector2.down : new Vector2(this.direction, 0);
			const { position } = obj.transform;
			this.attackingTimer = 20;
			ATTACK.create(obj, position.plus(dir.times(30)), dir, 70, {
				duration: this.attackingTimer,
				force: 20000
			});
			this.attackCooldown = 12;
		}

		this.attackCooldown--;
		this.attackingTimer--;

		if (this.attackingTimer > 0) {
			this.armAngle = -0.1 * this.attackingTimer;
			if (up || down) {
				if (up)
					this.armAngle -= Math.PI / 2;
				else if (down)
					this.armAngle += Math.PI / 2;
			}
		} else if (this.justMoving && rb.colliding.bottom) {
			this.armTimer++;
			this.armAngle = 0.4 * Math.sin(this.armTimer * Math.PI * 2 / this.walkAnimation.totalTime);
		} else if (rb.colliding.bottom) {
			this.armAngle = 0;
		}
	}
	drawArm(obj, xOffset, angle) {
		const r = this.frame.renderer;
		r.save();
		r.translate(10 + xOffset, 22);
		r.rotate(Math.PI / 2 + angle);
		r.image(this.armImage).rect(this.armRect);
		r.restore();
	}
	escapeDraw(obj) {
		scene.camera.drawInScreenSpace(() => {
			const pxSize = 3;
			const padding = this.healthImage.width * 0.2 * pxSize;
			for (let i = 1; i <= this.maxHealth; i++) {
				let yOffset = 0;
				if (obj.scripts.ENTITY.health < i) {
					if (!(i in this.healthLossTimers)) 
						this.healthLossTimers[i] = 0;
					this.healthLossTimers[i]++;
					yOffset = this.healthLossTimers[i] ** 2;
				}

				renderer.image(this.healthImage).rect(
					i * (this.healthImage.width * pxSize + padding) + padding,
					height - padding - this.healthImage.height * pxSize + yOffset,
					this.healthImage.width * pxSize,
					this.healthImage.height * pxSize + yOffset
				);
			}
		});
	}
	draw(obj, name, shape) {
		const { width, height, renderer: r } = this.frame;
		r.clear();
		if (this.direction === -1) r.invertX();

		this.drawArm(3, -this.armAngle);

		if (obj.scripts.ENTITY.dead)
			r.image(this.deadImage).rect(0, 0, width, height);
		else if (this.justMoving && this.rb.colliding.bottom)
			r.image(this.walkAnimation).rect(0, 0, width, height);
		else r.image(this.idleImage).rect(0, 0, width, height);

		if (obj.scripts.ENTITY.invincible)
			r.image(this.winceOverlay).rect(0, 0, width, height);

		if (obj.scripts.ENTITY.stunBlink)
			r.image(this.damageOverlay).rect(0, 0, width, height);

		this.drawArm(-5, this.armAngle);

		if (this.direction === -1) r.invertX();

		drawPixelAligned(renderer, () => {
			renderer.image(this.frame).rect(this.frameRect);
		});
		// renderer.draw(obj.scripts.ENTITY.stunBlink ? Color.WHITE : Color.BLACK).rect(shape);
		// renderer.draw(Color.RED).rect(shape.x, shape.y, shape.width, shape.height * obj.scripts.ENTITY.health / this.maxHealth);
		// if (this.stoppedTimer < 5)
		// 	renderer.draw(Color.LIME).rect(shape);
	}

	static create(x, y, controls, onDefeat) {
		const player = scene.main.addPhysicsRectElement("player", x, y, 40, 78, true, controls, "No Tag");
		player.scripts.add(PLAYER, onDefeat);
		return player;
	}
}