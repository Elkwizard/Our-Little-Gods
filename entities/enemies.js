const PROJECTILE_COLOR = new Color(157, 232, 192);

class DUMMY extends ElementScript {
	init(obj) {
		obj.scripts.removeDefault();
		obj.scripts.add(ENTITY, 20);
	}
	update(obj) {
	
	}
	draw(obj, name, shape) {
		renderer.draw(obj.scripts.ENTITY.stunBlink ? Color.WHITE : Color.CREAM).infer(shape);
		renderer.stroke(Color.LIGHT_GRAY, 4).infer(shape);
	}
	static create(x, y) {
		const dummy = scene.main.addPhysicsRectElement("dummy", x, y, 60, 160, true, new Controls("w", "s", "a", "d"), "No Tag");
		dummy.scripts.add(DUMMY);
		return dummy;
	}
}

class ARM_SEGMENT extends ElementScript {
	static WIDTH = 48;
	static HEIGHT = 38;
	init(obj, source, claw, target) {
		obj.scripts.removeDefault();
		this.claw = claw;
		this.source = source;
		this.target = target;
		this.image = loadResource(this.claw ? "claw.png" : "armSegment.png");
		obj.layer = source.layer - 1;
	}
	collideRule(obj, other) {
		if (other === this.source)
			return false;
		if (other.scripts.has(ARM_SEGMENT) && other.scripts.ARM_SEGMENT.source === this.source)
			return false;
		return true;
	}
	collideGeneral(obj, { element }) {
		if (!element.scripts.PHYSICS.isTrigger && this.claw) {
			ATTACK.create(this.source, obj.transform.position, obj.scripts.PHYSICS.velocity.normalized, 30, {
				...this.attackOptions,
				angleSpread: Random.angle()
			});
		}
	}
	update(obj) {
		if (this.claw) {
			const rb = obj.scripts.PHYSICS;
			const diff = this.target.minus(obj.transform.position);
			rb.velocity.add(diff.times(0.1));
		}
	}
	draw(obj, name, shape) {
		renderer.image(this.image).infer(shape);
	}
	static create(position, source, claw, target) {
		const seg = scene.main.addPhysicsRectElement("seg", position.x, position.y, ARM_SEGMENT.WIDTH, ARM_SEGMENT.HEIGHT, true, new Controls("w", "s", "a", "d"), "No Tag");
		seg.scripts.add(ARM_SEGMENT, source, claw, target);
		return seg;
	}
}

class BLAST extends ElementScript {
	init(obj, source, attackOptions) {
		obj.scripts.removeDefault();
		this.source = source;
		this.attackOptions = attackOptions;
	}
	collideRule(obj, other) {
		return other !== this.source;
	}
	collideGeneral(obj, { element }) {
		if (!element.scripts.PHYSICS.isTrigger)
			obj.remove();
	}
	update(obj) {
		ATTACK.create(this.source, obj.transform.position.plus(obj.scripts.PHYSICS.velocity), obj.scripts.PHYSICS.velocity.normalized, 30, {
			...this.attackOptions,
			angleSpread: Random.angle()
		});
	}
	static create(source, location, velocity, attackOptions) {
		const blast = scene.main.addPhysicsCircleElement("blast", location.x, location.y, 20, true, new Controls("w", "s", "a", "d"), "No Tag");
		blast.scripts.PHYSICS.velocity = velocity;
		blast.scripts.add(BLAST, source, attackOptions);
		return blast;
	}
}

class US extends ElementScript {
	static WIDTH = 90;
	static HEIGHT = 120;
	init(obj, player, messages, onDefeat) {
		obj.scripts.removeDefault();
		obj.scripts.add(ENTITY, 10);
		this.initialY = obj.transform.position.y;
		this.phase = 0;
		this.active = false;
		this.attackCooldown = 0;
		this.player = player;
		this.messages = messages;
		this.rb = obj.scripts.PHYSICS;
		const { rb } = this;
		rb.canRotate = false;
		this.onDefeat = onDefeat;
		this.direction = -1;
		this.flyingImage = loadResource("flying.png");
		this.blastAnimation = loadResource("blast");
		this.driveAnimation = loadResource("drive");
		this.primaryAnimation = null;
		this.cracksOverlay = loadResource("cracks.png");
		this.bodyFrame = new Frame(this.driveAnimation.width, this.driveAnimation.height, 1);
		this.headImage = loadResource("head.png");
		this.headFrame = new Frame(this.headImage.width, this.headImage.height, 1);
		this.headTargetOffset = new Vector2(0, 0);
		this.headOffset = new Vector2(0, 0);
		this.expressions = {};
		for (const expr of [
			"angry", "happy", "sad", "ambivalent", "nostalgic", "glitch"
		]) this.expressions[expr] = loadResource(`${expr}.png`);
		this.expression = null;
		this.defaultExpression = "ambivalent";
		const { width: exprWidth, height: exprHeight } = this.expressions.glitch;
		this.exprRect = new Rect(
			(this.headFrame.width - exprWidth) / 2,
			this.headFrame.height - exprHeight - (this.headFrame.width - exprWidth) / 2,
			exprWidth, exprHeight
		);
		this.nostalgic = false;
		this.blastTimer = 0;
		this.blastOffset = 0;
		this.targetBlastOffset = 0;
		this.jetpackFuel = 0;
		this.fuelRechargeTimer = 0;
		this.flying = false;

		this.particles = scene.main.addElement("particles", 0, 0);
		this.particles.scripts.add(PARTICLE_SPAWNER, {
			radius: 5,
			delay: 1,
			falls: false,
			slows: false,
			lifeSpan: 100,
			active: false,
			init(particle) {
				particle.velocity = Vector2.fromAngle(Random.angle()).times(Random.range(3, 5));
				particle.data.size = Random.range(20, 40);
				particle.data.radius = Random.range(10, 20);
				particle.timer -= Random.range(0, 0.2);
			},
			update(particle) {
				
			},
			draw(renderer, particle) {
				if (Math.sin((particle.timer * 20) ** 2) < 0)
					return;
				const { x, y } = particle.position;
				const s = particle.data.size;
				renderer.stroke(Color.SKY_BLUE, 3).circle(x, y, particle.data.radius);
				renderer.stroke(Color.SKY_BLUE, 3).rect(x - s / 2, y - s / 2, s, s);
			}
		});

		this.jetpack = scene.main.addElement("jetpack", 0, 0);
		this.jetpack.scripts.add(PARTICLE_SPAWNER, {
			radius: 5,
			delay: 0.05,
			falls: false,
			slows: false,
			lifeSpan: 100,
			active: false,
			init(particle) {
				const RANGE = 0.6;
				Random.distribution = Random.normal;
				particle.velocity = Vector2.fromAngle(
					Random.range(Math.PI / 2 - RANGE, Math.PI / 2 + RANGE)
				).times(Random.range(3, 5));
				Random.distribution = Random.uniform;
				particle.data.radius = Random.range(2.5, 5);
				particle.timer -= Random.range(0, 0.2);
			},
			update(particle) {
				
			},
			draw(renderer, particle) {
				renderer.draw(Color.WHITE, 3).circle(particle.position, particle.data.radius);
			}
		});

		this.jetpack.layer = -Infinity;
	}
	waxPoetic(obj) {
		this.messages.displayMessage(getStorySentence(this.phase));
	}
	subdue(obj) {
		this.active = false;
		this.dangerous = false;
		this.flying = false;		
	}
	resetPhase(obj) {
		if (!this.nostalgic) {
			this.phase--;
			this.subdue();
			this.onDefeat();
			// this.nextPhase();
		}
	}
	nextPhase(obj) {
		if (this.phase < 3) {
			this.phase++;
			this.active = true;
			this.dangerous = false;
			this.defaultExpression = "ambivalent";

			switch (this.phase) {
				case 1: {
					obj.scripts.ENTITY.health = 10;
					this.primaryAnimation = this.driveAnimation;
				}; break;
				case 2: {
					obj.scripts.ENTITY.health = 15;
					this.primaryAnimation = this.driveAnimation;
				}; break;
				case 3: {
					obj.scripts.ENTITY.health = 17;
					this.primaryAnimation = this.driveAnimation;
				}; break;
			}
		} else if (!this.nostalgic) {
			this.active = true;
			this.nostalgic = true;
			this.defaultExpression = "happy";
			obj.scripts.ENTITY.health = Infinity;
			obj.scripts.ENTITY.onHit.push(() => {
				this.waxPoetic();
			});
		}
	}
	headBob(obj, dir) {
		this.headTargetOffset = dir.times(20);
		intervals.delay(() => {
			this.headTargetOffset = Vector2.origin;
		}, 10);
	}
	headAttack(obj, dir) {
		const { position } = obj.transform;
		ATTACK.create(obj, position.plus(dir.times(30)), dir, 70, {
			force: 20000,
			color: Color.RED
		});
		this.headBob(dir);
		this.attackCooldown = Random.bool(0.1) ? 15 : 40;
	}
	blastAttack(obj, target) {
		const { position } = obj.transform;
		const dist = Vector2.dist(position, target);
		const dir = target.minus(position).normalized;
		this.blastTimer = this.blastAnimation.totalTime;
		this.blastAnimation.reset();
		const dx = dir.x * dist;
		const vix = 30 * Math.sign(dir.x);
		const g = scene.physicsEngine.gravity.y;
		intervals.delay(() => {
			BLAST.create(obj, position, new Vector2(vix, -0.5 * dx * g / vix), {
				force: 20000,
				color: PROJECTILE_COLOR
			});
			
			this.targetBlastOffset = 5;
			intervals.delay(() => {
				this.targetBlastOffset = 0;
			}, 3);
		}, this.blastAnimation.totalTime);	
	}
	armAttack(obj, target) {
		const { position } = obj.transform;
		const segments = [];
		const dist = Vector2.dist(target, position);
		const SEGMENTS = Number.clamp(Math.round(dist / ARM_SEGMENT.WIDTH), 2, 5);
		for (let i = 0; i < SEGMENTS; i++) {
			const claw = i === SEGMENTS - 1;
			const seg = ARM_SEGMENT.create(position, obj, claw, target);
			seg.transform.rotation = i % 2 ? Math.PI : 0;
			segments.push(seg);
		}
		for (let i = 1; i < SEGMENTS; i++) {
			const a = segments[i - 1];
			const b = segments[i];
			scene.constrainPosition(a, b, new Vector2(ARM_SEGMENT.WIDTH / 2, 0), new Vector2(-ARM_SEGMENT.WIDTH / 2, 0));
		}

		scene.constrainPosition(segments[0], obj, new Vector2(-ARM_SEGMENT.WIDTH / 2, 0));

		intervals.delay(() => {
			segments.last.scripts.ARM_SEGMENT.target = position;
			intervals.delay(() => {
				scene.main.removeElements(segments);
			}, 50);
		}, 70);
	}
	update(obj) {
		const { position } = obj.transform;
		const playerPos = this.player.transform.position;
		const dir = playerPos.minus(position).normalized;
		const dist = Vector2.dist(position, playerPos);

		const { rb } = this;
		rb.mobile = this.active;
		rb.canCollide = this.active;

		if (!this.active) {
			obj.transform.position.y = this.initialY;
			obj.transform.position = Vector2.round(obj.transform.position.over(PIXEL_SIZE)).times(PIXEL_SIZE);	
		}

		const CLOSE = 200;

		if (this.active && dist < CLOSE)
			this.dangerous = true;

		if (this.active && this.dangerous && !this.nostalgic && !this.player.scripts.ENTITY.dead) {
			if (this.attackCooldown <= 0) {
				switch (this.phase) {
					case 1: {
						if (dist < CLOSE) {
							this.headAttack(dir);
							this.attackCooldown = Random.bool(0.1) ? 15 : 40;
						}
					}; break;
					case 2: {
						if (dist < CLOSE) {
							this.headAttack(dir);
							this.attackCooldown = Random.bool(0.3) ? 15 : 40;
						} else {
							this.blastAttack(playerPos);
							this.attackCooldown = 100;
						}
					}; break;
					case 3: {
						if (dist < CLOSE) {
							this.headAttack(dir);
							this.attackCooldown = Random.bool(0.6) ? 15 : 40;
						} else if (Math.abs(dir.y) < 0.3) {
							this.blastAttack(playerPos);
							this.attackCooldown = 80;
						} else {
							this.armAttack(playerPos);
							this.attackCooldown = 150;
						}
					};
				}
			}

			this.attackCooldown--;
			this.blastTimer--;
			this.fuelRechargeTimer--;

			if (this.flying && this.jetpackFuel) {
				this.jetpackFuel--;
				rb.velocity.y -= 1;
				if (!this.jetpackFuel) {
					this.fuelRechargeTimer = 40;
					this.flying = false;
				}
			}
			
			if (this.fuelRechargeTimer <= 0 && !this.jetpackFuel)
				this.jetpackFuel = 80;

			switch (this.phase) {
				case 1: {
					rb.velocity.x = dir.x * Math.min(dist * 0.03, 3);
					this.direction = Math.sign(rb.velocity.x);
				}; break;
				case 2: {
					rb.velocity.x = dir.x * Math.min(dist * 0.06, 5);
					this.direction = Math.sign(rb.velocity.x);
				}; break;
				case 3: {
					rb.velocity.x = dir.x * Math.min(dist * 0.1, 7);
					this.direction = Math.sign(rb.velocity.x);

					if (this.jetpackFuel)
						this.flying = true;
				}; break;
			}

			if (obj.scripts.ENTITY.dead) {
				this.subdue();
				this.particles.scripts.PARTICLE_SPAWNER.explode(40, obj.transform.position);
				this.onDefeat();
				for (let i = 0; i < 3; i++)
					this.waxPoetic();
			}
		}

		this.expression = this.defaultExpression;
		if (obj.scripts.ENTITY.invincible)
			this.expression = "angry";
		if (!this.dangerous)
			this.expression = null;
		if (obj.scripts.ENTITY.dead)
			this.expression = "sad";
		if (this.player.scripts.ENTITY.dead)
			this.expression = "nostalgic";


		this.headOffset.add(this.headTargetOffset.minus(this.headOffset).times(0.2));
		this.blastOffset += 0.3 * (this.targetBlastOffset - this.blastOffset);

		this.jetpack.scripts.PARTICLE_SPAWNER.setProperties({ active: this.flying && this.jetpackFuel });
		this.jetpack.transform.position = position;

	}
	draw(obj, name, shape) {
		const { width, height, renderer: r } = this.bodyFrame;
		const { width: hwidth, height: hheight, renderer: rh } = this.headFrame;
		r.clear();
		rh.clear();
		if (this.direction === 1) {
			r.invertX();
			rh.invertX();
		}

		if (this.active && this.dangerous) {
			if (this.flying)
				r.image(this.flyingImage).rect(0, 0, width, height);		
			else
				r.image(this.primaryAnimation).rect(0, 0, width, height);	
		} else
			r.image(this.driveAnimation.frames[0]).rect(0, 0, width, height);

		if (this.phase >= 2) {
			const blastRect = new Rect(10 + this.blastOffset, 20, this.blastAnimation.width, this.blastAnimation.height);
			if (this.blastTimer > 0)
				r.image(this.blastAnimation).rect(blastRect);
			else
				r.image(this.blastAnimation.frames[0]).rect(blastRect);
		}

			
		rh.image(this.headImage).rect(0, 0, hwidth, hheight);
		if (this.expression)
			rh.image(this.expressions[this.expression]).rect(this.exprRect);

		if (obj.scripts.ENTITY.health <= 5) {
			rh.alpha = r.alpha = 1 - obj.scripts.ENTITY.health / 5;
			r.image(this.cracksOverlay).rect(0, 0, width, height);
			rh.image(this.expressions.glitch).rect(this.exprRect);
			rh.alpha = r.alpha = 1;
		}

		if (this.direction === 1) {
			r.invertX();
			rh.invertX();
		}

		drawPixelAligned(renderer, () => {
			renderer.image(this.bodyFrame).rect(shape);
			const absoluteOffsetX = -8;
			const offsetX = 8;
			const offsetY = -30;
			const factor = obj.width / width;
			renderer.image(this.headFrame).rect(
				pixelRound((absoluteOffsetX + offsetX * this.direction) * factor + this.headOffset.x),
				pixelRound(offsetY * factor + this.headOffset.y),
				hwidth * factor, hheight * factor
			);
		});
		// renderer.draw(obj.scripts.ENTITY.stunBlink ? Color.WHITE : Color.GRAY).rect(shape);
		// renderer.stroke(Color.BLACK, 4).rect(shape);
	}
	static create(x, y, player, messages, onDefeat) {
		const us = scene.main.addPhysicsRectElement("us", x, y, US.WIDTH, US.HEIGHT, true, new Controls("w", "s", "a", "d"), "No Tag");
		us.scripts.add(US, player, messages, onDefeat);
		return us;
	}
}