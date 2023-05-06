const createGodRays = (image, PIXEL_SIZE = 1, DISTANCE_SCALE = PIXEL_SIZE) => {
	const godRays = new GPUShader(image.width / PIXEL_SIZE, image.height / PIXEL_SIZE, `
		uniform int lightDistance;
		uniform vec4 ambientLighting;
		uniform vec4 lightColor;
		uniform vec2 lightPosition;
		uniform float lightIntensity;
		uniform float localAttenuation;
		uniform float globalAttenuation;
		uniform float solidLightCutoff;
		uniform float clouds;
		uniform float stars;
		uniform float time;

		uniform sampler2D image;

		highp float random11(highp float seed) {
			highp float a = mod(seed * 6.12849, 8.7890975);
			highp float b = mod(a * 256745.4758903, 232.567890);
			return mod(abs(a * b), 1.0);
		}

		highp float random21(highp vec2 seed) {
			return random11(seed.x + 3.238975 * seed.y + 5.237 * seed.x);
		}

		highp vec2 smoothT(highp vec2 t) {
			return t * t * (-2.0 * t + 3.0);
		} 

		highp float perlin(highp vec2 seed) {
			highp vec2 samplePoint = floor(seed);
			highp float a = random21(samplePoint);
			highp float b = random21(samplePoint + vec2(1.0, 0.0));
			highp float c = random21(samplePoint + vec2(0.0, 1.0));
			highp float d = random21(samplePoint + vec2(1.0));
			highp vec2 t = smoothT(mod(seed, 1.0));
			return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
		}
		highp float octavePerlin(highp vec2 seed) {
			seed += 10.0;
			highp float sum = 0.0;
			highp float scale = 0.0;
			for (highp float o = 0.0; o < 20.0; o++) {
				highp float i = o + 1.0;
				sum += perlin(seed * i) / i;
				scale += 1.0 / i;
			}
			return sum / scale;
		}

		float getClouds(vec2 pos) {
			float oc = clamp(octavePerlin(pos * vec2(14.0, 12.0)) - 0.1, 0.0, 1.0);
			float pr = perlin(vec2(pos.x, 0.0) * 0.01);
			float yCutoff = mix(0.5, 0.7, pr);
			float cutoffFactor = smoothstep(yCutoff + 0.3, yCutoff - 0.1, pos.y);
			float t = clamp(pow(oc * 2.0, 3.5) * cutoffFactor, 0.0, 1.0);
			return mix(0.0, oc, t);
		}

		float getStars(vec2 pos) {
			float star = random21(pos) > 0.999 ? 1.0 : 0.0;
			return star + pow(octavePerlin(pos * 10.0), 10.0);
		}

		#define BACKGROUND_THRESHOLD 0.25

		bool light(vec2 uv) {
			vec4 color = texture(image, uv);
			return color.a < BACKGROUND_THRESHOLD;
		}

		float getFactor(float distance, float attn) {
			return clamp(1.0 / pow(distance * attn + 1.0, 2.0) - 0.05, 0.0, 1.0);
		}

		vec4 getDirectionalLight(vec2 uv) {
			if (light(uv)) return vec4(0.0);

			float distance = 100000.0;

			vec2 lightDirection = normalize(position - lightPosition);

			for (int i = 0; i < lightDistance; i++) {
				float fi = float(i);
				vec2 guv = uv - lightDirection * fi / resolution;
				if (light(guv)) {
					distance = (fi + 2.0) * float(${DISTANCE_SCALE});
					break;
				}
			}

			float globalDistance = max(0.0, length(position - lightPosition) - solidLightCutoff);
			float globalFalloff = getFactor(globalDistance, globalAttenuation);
			float localFalloff = getFactor(distance, localAttenuation);

			return lightColor * lightIntensity * globalFalloff * localFalloff;
		}

		vec4 shader() {
			time;

			vec2 uv = position / resolution;
			vec4 directional = getDirectionalLight(uv);
			vec4 albedo = texture(image, uv);
			if (clouds > 0.0 && light(uv)) {
				float cloud = getClouds(vec2(uv.x + time * 0.0007, uv.y));
				return vec4(1.0, 1.0, 1.0, clouds * cloud);
			}

			if (stars > 0.0 && light(uv)) {
				float star = getStars(uv);
				return vec4(1.0, 1.0, 1.0, stars * star);
			}

			// return albedo;

			return albedo * (ambientLighting + directional);
		}
	`);


	return function ({
		direction,
		position = direction.times(-100000),
		color = new Color(255, 255, 255),
		ambient = new Color(20, 20, 20),
		intensity = 2,
		attenuation = direction ? 0 : 0.1,
		solidUntil = 0,
		clouds = 0,
		stars = 0
	}) {
		godRays.setArguments({
			image,
			clouds, stars,
			time: intervals.frameCount,
			lightColor: color,
			ambientLighting: ambient,
			lightPosition: position.over(DISTANCE_SCALE),
			lightIntensity: intensity,
			lightDistance: 200 / DISTANCE_SCALE,
			globalAttenuation: attenuation,
			localAttenuation: 0.03,
			solidLightCutoff: solidUntil / DISTANCE_SCALE
		});

		return godRays;
	};
};