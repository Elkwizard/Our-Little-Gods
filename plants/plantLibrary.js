const { PLANT_LIBRARY } = (() => {
	
	const PLANT_LIBRARY = {

		CHERRY_BLOSSOM: createPlantType({
			trunkLength: [30, 130],
	
			branches: [2, 3],
			trunkColor: [new Color("#545454"), new Color("#737373")],
			leafColor: [new Color("#e693b8"), new Color("#e8bcd0")],
			leafLength: 5,
			leafWidth: 5,
			baseAge: 1,
			branchAngle: [0.7, 0.9],
		}, 2),
	
		OAK: createPlantType({
			trunkLength: [50, 150],
	
			trunkColor: [new Color("#4d4239"), new Color("#736347")],
			leafColor: [new Color("#406335"), new Color("#60b543")],
			baseAge: 1,
		}, 2),
	
		BIRCH: createPlantType({
			trunkLength: [50, 150],
	
			branches: [1, 3],
			trunkColor: [new Color("#e5ebb0"), new Color("#d8dbba")],
			leafColor: [new Color("#406335"), new Color("#60b543")],
			baseAge: 0,
			branchAngle: 0.6
		}, 2),
	
		MARSH_GRASS: createPlantType({
			trunkLength: 1,
	
			branches: 3,
			ruffle: 0,
			baseAge: 0,
			leafColor: [new Color("#73b848"), new Color("#6d8042")],
			leafLength: [40, 80],
			leafWidth: [1, 5],
			leafDensity: 1,
			leaves: [1, 2],
			leafSpread: 0.5
		}, 0),
		
		GRASS: createPlantType({
			trunkLength: 1,
	
			branches: 0,
			ruffle: 0.1,
			baseAge: 0,
			leafColor: [new Color("#194d03"), new Color("#446b14")],
			leafLength: [20, 40],
			leafWidth: [1, 5],
			leafDensity: 0,
			leaves: [3, 5],
			leafSpread: Math.PI / 2
		}, 0),
	
		WHEAT: createPlantType({
			trunkLength: [30, 50],
	
			branches: 1,
			twigWidth: 2,
			trunkWidthFactor: 1,
			leafColor: [new Color("#c2a35b"), new Color("#917739")],
			trunkColor: [new Color("#5b7a30"), new Color("#73993a")],
			leafSpread: 0.1,
			leafLength: 8,
			leafWidth: 8,
			leafDensity: 4
		}, 2),
	
		CAT_TAIL: createPlantType({
			trunkLength: [30, 50],
	
			branches: 1,
			twigWidth: 2,
			trunkWidthFactor: 1,
			trunkColor: [new Color("#507310"), new Color("#317310")],
			leafSpread: (rng, age) => {
				if (age === 1) return 0;
				return 0.4;
			},
			ruffle: 0,
			leafColor: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex === 1) return rng.lerp(new Color("#5e3a0b"), new Color("#734b17"));
					return rng.lerp(new Color("#362209"), new Color("#1f1407"));
				}
				return rng.lerp(new Color("#6b8217"), new Color("#317310"));
			},
			leafLength: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex === 1) return 40;
					return 50;
				}
				return rng.range(25, 200);
			},
			leafWidth: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex === 1) return 8;
					return 3;
				}
	
				return 3;
			},
			leaves: (rng, age) => {
				if (age === 1) return 2;
				if (age > 6) return 4;
				return 0;
			},
			leafDensity: Infinity
		}, 2),
	
		BERRY_BUSH: createPlantType({
			trunkLength: [20, 25],
	
			trunkColor: [new Color("#4d4239"), new Color("#736347")],
			leafColor: rng => {
				if (rng.bool(0.95))
					return rng.lerp(new Color("#406335"), new Color("#60b543"));
				return rng.lerp(new Color("#a1124b"), new Color("#cf1b36"));
			},
			branches: 3,
			baseAge: 2,
			branchAngle: [0, Math.PI]
		}, 2),
	
		CONIFER: createPlantType({
			trunkLength: [45, 70],
	
			branches: 3,
			trunkColor: [new Color("#473109"), new Color("#5c3b04")],
			leafColor: [new Color("#133014"), new Color("#164d18")],
			leafLength: [8, 12],
			leafWidth: 1,
			leafDensity: 3,
			leaves: 3,
			branchScaleFactor: 0.5,
			trunkScaleFactor: 0.9,
			baseAge: 3,
			branchAngle: 1.6,
			ruffle: 0.2,
			twigWidth: 0.012,
		}, 2),
	
		BAMBOO: createPlantType({
			trunkLength: [40, 100],
	
			oldestBranch: 3,
			branches: [1, 2],
			trunkColor: (rng, age) => {
				return (age % 2) ? new Color("#819144") : new Color("#6c7548");
			},
			leafColor: [new Color("#507317"), new Color("#5c8024")],
			leafDensity: [4, 6],
			leaves: [3, 7],
			leafLength: 20,
			leafWidth: 4,
			leafSpread: Math.PI,
			ruffle: 0.1,
			trunkWidthFactor: 1,
			twigWidth: 3
		}, 1),
	
		DAFFODIL: createPlantType({
			trunkLength: [20, 30],
	
			branches: 1,
			trunkColor: [new Color("#58963f"), new Color("#3f7829")],
			trunkWidthFactor: 1,
			twigWidth: 3,
			leafDensity: Infinity,
			ruffle: 0.1,
			baseAge: -2,
			leafSpread: (rng, age) => {
				if (age === 1) return 2;
				if (age > 2) return 0.8;
				return 0;
			},
			leafWidth: (rng, age) => {
				if (age === 1) return 5;
				return 5;
			},
			leafLength: (rng, age) => {
				if (age === 1) return 15;
				return rng.range(15, 40);
			},
			leafColor: (rng, age, node) => {
				if (age === 1) return rng.lerp(new Color("#adb00c"), new Color("#a88f00"));
				return rng.lerp(new Color("#058218"), new Color("#107d21"));
			},
			leaves: (rng, age) => {
				if (age === 1) return 3;
				if (age > 2) return rng.int(8, 10);
				return 0;
			},
		}, 3),
	
		TOM: createPlantType({
			trunkLength: [90, 150],
			baseAge: -2,
			scaleFactor: 1,
			trunkColor: [new Color("#d68dcc"), new Color("#d68d8d")],
			leafColor: [new Color("#544bb3"), new Color("#714bb3")],
			branchAngle: 0.9,
			trunkWidthFactor: [.7, .85],
			leaves: [100, 150],
			leafSpread: Math.PI * 2,
			ruffle: .2,
			twigWidth: 2.5,
			leafDensity: 1,
			branches: 2,
			leafLength: [70, 100],
			leafWidth: [2, 4],
	
		}, 2),
	
		SHROM: createPlantType({
			trunkLength: [10, 40],
			scaleFactor: 1,
			trunkColor: [new Color("#d9c3b8"), new Color("#ebe3df")],
			leafColor: [new Color("#1f6e52"), new Color("#26917e")],
			branchAngle: 0.9,
			trunkWidthFactor: 1,
			leaves: [40, 70],
			leafSpread: [.3, 2],
			ruffle: .32,
			twigWidth: [2, 3],
			leafDensity: 1,
			branches: 1,
			leafLength: [2, -30],
			leafWidth: [3, 5],
		}, 1),
	
		STONE: createPlantType({
			trunkLength: 1,
			leafColor: [new Color("#6f7187"), new Color("#8d90b0")],
			branchAngle: 0.9,
			leaves: 2,
			leafSpread: [.3, 2],
			ruffle: .2,
			leafLength: [1, 6],
			leafWidth: [10, 32],
		}, -1),
	
		DESERT_BUSH: createPlantType({
			trunkLength: [20, 50],
	
			branches: 3,
			branchAngle: Math.PI / 2,
			baseAge: 0,
			scaleFactor: 0.9,
			twigWidth: 0.2,
			trunkColor: [new Color("#8a7c72"), new Color("#6e625a")],
			leaves: 0,
			ruffle: 1,
		}, 1),
	
		SUNFLOWER: createPlantType({
			trunkLength: [40, 70],
	
			trunkColor: [new Color("#406335"), new Color("#60b543")],
			branches: 1,
			leafDensity: 8,
			ruffle: 0,
			leafSpread: (rng, age) => {
				if (age === 1) return Math.PI * 2;
				return Math.PI * 2;
			},
			leafColor: (rng, age, node) => {
				if (age === 1) {
					const index = node.parent.children.indexOf(node);
					if (index % 2) return rng.lerp(new Color("#402e1e"), new Color("#423428"));
					return rng.lerp(new Color("#c9af00"), new Color("#e6aa09"));
				}
				return rng.lerp(new Color("#487a3a"), new Color("#6a8f60"));
			},
			leafLength: (rng, age, node) => {
				if (age === 1) {
					const index = node.parent.children.indexOf(node);
					if (index % 2) return 15;
					return 40;
				}
				return rng.range(20, 30);
			},
			leaves: (rng, age) => {
				if (age === 1) return 80;
				if (age > 3) return 2;
				return 0;
			},
			leafWidth: (rng, age) => {
				if (age === 1) return rng.range(3, 4);
				return rng.range(10, 20);
			},
			trunkWidthFactor: 1,
			twigWidth: 5,
	
			branchAxis: (rng, age) => {
				if (age === 1) return Vector3.forward;
				return Node.random3D(rng);
			}
		}, 1),
	
		DAISY: createPlantType({
			trunkLength: [20, 40],
	
			trunkColor: [new Color("#406335"), new Color("#60b543")],
			ruffle: 0,
			branches: 1,
			leafDensity: 8,
			leafSpread: (rng, age) => {
				if (age === 1) return Math.PI * 2;
				return Math.PI * 2;
			},
			leafColor: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex % 2) return rng.lerp(new Color("#b58604"), new Color("#d9a109"));
					return rng.lerp(new Color("#fff6de"), new Color("#fffaed"));
				}
				return rng.lerp(new Color("#487a3a"), new Color("#6a8f60"));
			},
			leafLength: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex % 2) return 5;
					return 15;
				}
				return rng.range(10, 25);
			},
			leaves: (rng, age) => {
				if (age === 1) return 40;
				if (age > 3) return 2;
				return 0;
			},
			leafWidth: (rng, age, node) => {
				if (age === 1) {
					if (node.childIndex % 2) return rng.range(3, 4);
					return 2;
				}
				return rng.range(5, 10);
			},
			trunkWidthFactor: 1,
			twigWidth: 5,
			ruffle: 0.1
		}, 1),
	
		FIRE_CACTUS: createPlantType({
			trunkLength: [20, 40],
	
			twigWidth: 5,
			trunkWidthFactor: 1,
			branches: (rng, age) => {
				if (age % 3) return 1;
				return 2;
			},
			leafDensity: 6,
			branchAngle: 0.4,
			scaleFactor: 1,
			baseAge: 7,
			trunkColor: (rng, age, node) => {
				const RED = rng.lerp(new Color("#9c4808"), new Color("#9c2d08"));
				const YELLOW = rng.lerp(new Color("#acc204"), new Color("#c7c70e"));
				const GREEN = rng.lerp(new Color("#4f940a"), new Color("#62961e"));
				return new Gradient([
					{ start: 0, value: RED },
					{ start: 5, value: YELLOW },
					{ start: 7, value: GREEN },
				]).sample(age - 1);
			},
			leaves: 1,
			leafColor: (rng, age, node) => {
				return new Gradient([
					{ start: 0, value: new Color("#759c49") },
					{ start: 6, value: new Color("#426e0f") },
				]).sample(age - 1);
			},
			leafLength: 6,
			leafWidth: 3,
		}, 2),
	};

	return { PLANT_LIBRARY };
})();