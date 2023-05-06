const { createPlantType, applyWind, Node } = (() => {

	class Node {
		constructor(length, angle, axis) {
			this.length = length;
			this.angle = angle;
			this.axis = axis.get();
			this.angleOffset = 0;
			this.color = Color.RED;
			this.width = 1;
			this.parent = null;
			this.childIndex = null;
			this.children = [];
			this.tempZ = 0;
			this.tempDirection = Vector3.origin;
			this.tempEnd = Vector3.origin;
			this.endWidth = null;
			this._mass = -1;
		}
		set parent(a) {
			this._parent = a;
			if (a !== null && this.children.length > 0)
				a.endWidth = this.width;
		}
		get parent() {
			return this._parent;
		}
		get root() {
			if (this.parent === null) return this;
			return this.parent.root;
		}
		get mass() {
			if (this._mass === -1) {
				let max = 0;
				for (let i = 0; i < this.children.length; i++) {
					const mass = this.children[i].mass;
					if (mass > max) max = mass;
				}
				this._mass = this.width * this.length + max;
			}
			return this._mass;
		}
		forEach(fn, maxDepth, depth = 0) {
			if (depth > maxDepth) return;
			fn(this, depth);
			for (let i = 0; i < this.children.length; i++)
				this.children[i].forEach(fn, maxDepth, depth + 1)
		}
		forEachLeaf(fn, depth = 0) {
			if (this.children.length === 0) fn(this, depth);
			else for (let i = 0; i < this.children.length; i++)
				this.children[i].forEachLeaf(fn, depth + 1);
		}
		getBoundingBox(x, y, update) {
			let minX = Infinity;
			let minY = Infinity;
			let maxX = -Infinity;
			let maxY = -Infinity;
			const add = (p, r) => {
				if (p.x - r < minX) minX = p.x - r;
				if (p.y - r < minY) minY = p.y - r;
				if (p.x + r > maxX) maxX = p.x + r;
				if (p.y + r > maxY) maxY = p.y + r;
			};
			this.layoutXY(x, y, (node, pos, end) => {
				const radius = node.width / 2;
				add(pos, radius);
				add(end, radius);
			}, update);
			return new Rect(minX, minY, maxX - minX, maxY - minY);
		}
		draw(renderer, pos, end) {

			// renderer.stroke(this.color, 1).line(pos, end);
			// return;

			if (this.endWidth !== null && this.endWidth !== this.width) {
				const normal = new Vector2(pos.y - end.y, end.x - pos.x).normalize();
				const offset1 = normal.Ntimes(this.width / 2);
				const offset2 = normal.Nmul(this.endWidth / 2);
				const shape = [
					end.minus(offset2),
					pos.minus(offset1),
					offset1.Vadd(pos),
					offset2.Vadd(end),
				];
				renderer.draw(this.color).shape(shape);
				// renderer.stroke(Color.BLACK).shape(shape);
			} else {
				renderer
					.stroke(this.color, this.width, LineCap.ROUND)
					.line(pos, end);
			}
		}
		render(renderer, x, y, update) {
			this.layoutXY(x, y, (node, pos, end) => node.draw(renderer, pos, end), update);
		}
		getDirection(direction) {
			// this.axis.rotateXZ(0.01);
			direction.get(this.tempDirection);
			const angle = this.angle + this.angleOffset;
			return angle ? this.tempDirection.rotateAboutAxis(this.axis, angle) : this.tempDirection;
		}
		layoutXY(x, y, action, update = true) {
			if (update) this.getDirection(Vector3.up);
			this.layout(new Vector3(x, y, 0), action, update);
		}
		layout(pos, action, update) {
			const direction = this.tempDirection;

			// end = pos + direction * this.length (stored in tempEnd) 
			const end = direction
				.times(this.length, this.tempEnd)
				.add(pos);

			action(this, pos, end);

			if (update)
				for (let i = 0; i < this.children.length; i++)
					this.children[i].getDirection(direction);

			for (let i = 0; i < this.children.length; i++)
				this.children[i].layout(end, action, update);
		}
		sort() {
			this.forEach(node => {
				if (node.children.length === 0 || node.children[0].children.length === 0) return;
				node.children.sort((a, b) => a.tempDirection.z - b.tempDirection.z);
			});
		}
		child(length, angle, axis) {
			const node = (typeof length === "object") ? length : new Node(length, angle, axis);
			node.parent = this;
			node.childIndex = this.children.length;
			this.children.push(node);
			return node;
		}
		static random3D(rng) {
			rng.distribution = Random.normal;
			const vec = new Vector3(
				rng.range(-1, 1),
				rng.range(-1, 1),
				rng.range(0, 1),
			).normalize();
			rng.distribution = Random.uniform;
			return vec;
		}
	}

	function bakePlant(plant, bakeDepth = 0, depth = -1) { // assumes root layout call

		const bound = plant.getBoundingBox(0, 0, false);

		if (depth >= bakeDepth) { // bake

			const box = plant.getBoundingBox(0, 0, false);

			// render
			const frame = new Frame(box.width, box.height);
			plant.render(frame.renderer, -box.x, -box.y, false);
			let image = null;
			intervals.delay(
				() => image = new StaticImage(frame),
				Random.range(0, 500)
			);
			
			plant.children = [];
			const defaultAngle = plant.tempDirection.angleXY;

			if (bakeDepth > -1) {
				plant.draw = (renderer, pos, end) => {
					const angle = end.minus(pos).angleXY;
					const rotate = Geometry.signedAngularDist(angle, defaultAngle);
					renderer.save();
					renderer.translate(pos.x, pos.y);
					renderer.rotate(rotate);
					renderer.image(image ?? frame).default(box.x, box.y);
					if (isDebug()) renderer.stroke(Color.BLUE).rect(box);
					renderer.restore();
				};
			} else {
				plant.draw = (renderer, pos, end) => {
					renderer.image(frame).default(box.x + pos.x, box.y + pos.y);
				};
			}
		} else
			for (let i = 0; i < plant.children.length; i++)
				bakePlant(plant.children[i], bakeDepth, depth + 1);
			
		plant.getBoundingBox = (x, y) => bound.move(new Vector2(x, y));
		
		return plant;
	}

	function preparePlant(rng, plant, ruffle = 0.5, bakeDepth = Infinity) {

		if (ruffle > 0) {
			const variability = ruffle;
			rng.distribution = Random.normal;
			plant.forEach((node, depth) => {
				const scale = Math.log(depth + 1);
				node.axis.x += rng.range(-variability, variability) * scale;
				node.axis.y += rng.range(-variability, variability) * scale;
				node.axis.z += rng.range(-variability, variability) * scale;
				node.axis.normalize();
				node.angle += rng.range(-variability, variability) * scale;
			});
			rng.distribution = Random.uniform;
		}

		// z sorting
		plant.layoutXY(0, 0, node => node.mass);
		plant.sort();

		if (isFinite(bakeDepth)) { // bake
			bakePlant(plant, bakeDepth);
		}

		return plant;
	}

	function getPlantParameter(rng, value, age, node, rand = rng.random.bind(rng)) {
		if (value instanceof Array) return Interpolation.lerp(value[0], value[1], rand());
		if (value instanceof Function) return value(rng, age, node);
		return value;
	}

	function getPlantSeed(rng) {
		return rng.range(0, 100000);
	}

	function addPlantLeaves(rng, {
		leaves = 3,
		leafDensity = 3,
		leafColor = Color.GREEN,
		leafWidth = [4, 10],
		leafLength = 10,
		leafSpread = Math.PI,
	}, node, age, axis = Node.random3D(rng)) {

		const p = (value, age, node, rand) => getPlantParameter(rng, value, age, node, rand);

		if (age <= p(leafDensity, age, node)) { // add leaves
			const LEAVES = p(leaves, age, node);
			const SPREAD = p(leafSpread, age, node);
			for (let i = 0; i < LEAVES; i++) {
				let leafAngle = Number.remap((i + 1) / (LEAVES + 1), 0, 1, -SPREAD / 2, SPREAD / 2);
				const leaf = node.child(0, leafAngle, axis);
				leaf.seed = getPlantSeed(rng);
				leaf.length = p(leafLength, age, leaf);
				leaf.width = p(leafWidth, age, leaf);
				leaf.color = p(leafColor, age, leaf);
			}
		}
	}

	function createPlantBasic(rng, {
		branches = 3,
		branchAngle = 0.7,
		scaleFactor = 0.8,
		trunkScaleFactor = scaleFactor,
		branchScaleFactor = scaleFactor,
		trunkColor = Color.BROWN,
		twigWidth = 0.12,
		trunkWidthFactor = 0.47,
		oldestBranch = Infinity,
		branchAxis = () => Node.random3D(rng)
	}, age, trunkLength, axis = Node.random3D(rng), angle = 0) {

		const p = (value, age, node, rand) => getPlantParameter(rng, value, age, node, rand);

		const TRUNK_LENGTH = trunkLength;
		const TWIG_WIDTH = p(twigWidth, age, null);

		const root = new Node(TRUNK_LENGTH, angle, axis);
		root.seed = getPlantSeed(rng);
		root.width = 1 + TWIG_WIDTH * (1 / p(trunkWidthFactor, age, root)) ** age;
		root.color = p(trunkColor, age, root, () => rng.perlin(age, 0.3));

		const params = arguments[1];

		const segmentAge = age - 1;
		if (segmentAge > 0) {

			const BRANCHES = Math.round(p(branches, segmentAge, root));

			if (BRANCHES > 0) {
				const AXIS = p(branchAxis, segmentAge, root);

				if (BRANCHES > 1 && segmentAge < oldestBranch) {
					const BRANCH_ANGLE = p(branchAngle, segmentAge, root) * rng.sign();
					root.child(createPlantBasic(
						rng, params, segmentAge,
						TRUNK_LENGTH * p(branchScaleFactor, segmentAge, root),
						AXIS, BRANCH_ANGLE
					));
					if (BRANCHES > 2) root.child(createPlantBasic(
						rng, params, segmentAge,
						TRUNK_LENGTH * p(branchScaleFactor, segmentAge, root),
						AXIS, -BRANCH_ANGLE
					));
				}

				root.child(createPlantBasic(
					rng, params, segmentAge,
					TRUNK_LENGTH * p(trunkScaleFactor, segmentAge, root),
					AXIS, 0
				));
			}
		}

		addPlantLeaves(rng, params, root, age, axis);

		return root;
	}

	function createPlantType(params, bakeDepth = Infinity) {
		return (
			rng = Random,
			trunkLength = getPlantParameter(rng, params.trunkLength)
		) => {
			const age = Math.floor(Math.max(0, Math.log2(Math.abs(trunkLength)) + (params.baseAge ?? 1)));
			const plant = createPlantBasic(rng, params, age, trunkLength);
			const root = new Node(0.00001, 0, Vector3.up);
			root.child(plant);
			addPlantLeaves(rng, params, root, age + 1);
			return preparePlant(rng, root, params.ruffle, bakeDepth);
		};
	}

	function applyWind(rng, plant, baseWind = 0) {
		plant.forEach(node => {
			const active = rng.perlin(intervals.frameCount, 0.03, node.seed) > 0.7;
			const wind = (baseWind + (active ? 0.2 : 0)) * 1 / node.mass;

			if (!node.angularVelocity) node.angularVelocity = 0;
			node.angleOffset += node.angularVelocity;
			node.angularVelocity += wind - node.angleOffset * 0.01;
			node.angularVelocity *= 0.95;
		});
		return plant;
	}

	return { createPlantType, applyWind, Node };
})();