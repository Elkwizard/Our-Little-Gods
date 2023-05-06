const ff = new FastFrame(width, height);
const gl = ff.renderer;

const postProcess = (() => {
	const godRays = createGodRays(canvas, PIXEL_SIZE);
	canvas.clearScreen = () => {
		renderer.clear();
		gl.clear();
	};
	
	const nightAmbient = new Color(100, 100, 120);
	const dayAmbient = new Color(200, 200, 200);

	const ambientGradient = new Gradient([
		{ start: 0, value: nightAmbient },
		{ start: 12, value: dayAmbient },
		{ start: 24, value: nightAmbient }
	]);
	
	const midnightIntensity = 1.5;
	const duskIntensity = 0.8;
	const noonIntensity = 1;
	const morningIntensity = 1;
	
	const intensityGradient = new Gradient([
		{ start: 0, value: midnightIntensity },
		{ start: 1, value: duskIntensity },
		{ start: 7, value: 0 },
		{ start: 8, value: morningIntensity },
		{ start: 12, value: noonIntensity },
		{ start: 18, value: morningIntensity },
		{ start: 19, value: 0 },
		{ start: 23, value: duskIntensity },
		{ start: 24, value: midnightIntensity }
	]);
	
	const noonColor = new Color(255, 250, 200);
	const sunset1Color = Color.ORANGE;
	const sunset2Color = Color.PURPLE;
	const moonColor = new Color(200, 200, 255);
	
	const colorGradient = new Gradient([
		{ start: 0, value: moonColor },
		{ start: 1, value: moonColor },
		{ start: 7, value: sunset2Color },
		{ start: 8, value: sunset1Color },
		{ start: 12, value: noonColor },
		{ start: 18, value: sunset1Color },
		{ start: 19, value: sunset2Color },
		{ start: 23, value: moonColor },
		{ start: 24, value: moonColor }
	]);

	const noonSky = Color.SKY_BLUE;
	const sunset1Sky = new Color(255, 250, 220);
	const sunset2Sky = new Color(255, 220, 250);
	const duskSky = new Color(20, 20, 50);
	const nightSky = new Color(10, 10, 40);
	
	const skyGradient = new Gradient([
		{ start: 0, value: nightSky },
		{ start: 1, value: duskSky },
		{ start: 7, value: sunset2Sky },
		{ start: 8, value: sunset1Sky },
		{ start: 12, value: noonSky },
		{ start: 18, value: sunset1Sky },
		{ start: 19, value: sunset2Sky },
		{ start: 23, value: duskSky },
		{ start: 24, value: nightSky }
	]);

	const startTime = 9;

	return () => {
		const hour = (intervals.frameCount * 0.001 + startTime) % 24;
		const night = hour < 7 || hour > 19;
		const lightAngle = Math.PI - mod(hour - 7, 12) * Math.PI / 12;
		const direction = Vector2.fromAngle(lightAngle);
		const intensity = intensityGradient.sample(hour);
		const color = colorGradient.sample(hour);
		const sky = skyGradient.sample(hour);
		const ambient = ambientGradient.sample(hour);
		renderer.image(ff).rect(0, 0, width, height);
		const image = godRays({
			direction, color,
			intensity: 2 * intensity, ambient,
			clouds: night ? 0 : intensity,
			stars: night ? intensity : 0
		});
		renderer.fill(sky);
		renderer.image(image).rect(0, 0, width, height);

		if (isDebug()) {
			renderer.textMode = TextMode.TOP_LEFT;
			renderer.draw(Color.RED).text(Font.Arial20, intervals.fps, 10, 10);
		}
	};
})();