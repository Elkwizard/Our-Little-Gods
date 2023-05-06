
function getProbabilityMap(text, keyLength) {
	const words = text
		.replaceAll("'", "_")
		.split(/\b/g)
		.map(x => x.trim())
		.filter(x => x.match(/\S/))
		.map(x => x.replaceAll("_", "'"));
	const map = new Map();
	for (let i = 0; i < words.length - keyLength; i++) {
		const seq = [];
		for (let j = 0; j < keyLength + 1; j++) {
			seq.push(words[i + j]);
			if (seq.length >= 2) {
				const key = seq.slice(0, -1).join("_");
				if (map.has(key))
					map.get(key).push(seq.last);
				else map.set(key, [seq.last]);
			
			}
		}
	}

	return { map, keyLength };
}

function generateSentence({ map, keyLength }, terminators = new Set(".?!")) {
	const result = Random.choice(
		[...map.keys()]
			.filter(l => l[0].match(/[A-Z]/g))
			.map(w => w.split("_"))
			.filter(w => w.length === 1)
	); // initial choice

	const mapCopy = new Map();
	for (const [context, next] of map) {
		mapCopy.set(context, [...next]);
	}

	do {
		const context = result.slice(-Math.min(result.length, keyLength));
		const key = context.join("_");
		if (!mapCopy.has(key))
			break;
		const choices = mapCopy.get(key);
		if (!choices.length)
			break;
		const next = Random.choice(choices);
		choices.splice(choices.indexOf(next), 1);
		result.push(next);
	} while (!terminators.has(result.last));

	return result.join(" ")
		.replace(/ (\,|\!|\.|\?|'|\:|\;)/g, "$1")
		.replaceAll(" - ", "-")
		.replace(/\" (.*?) \"/g, "\"$1\"")
		.replace(/\( (.*?) \)/g, "($1)");
}

function generateConstrainedSentence(map, terminators, constraint) {
	let text;
	do {
		text = generateSentence(map, terminators);
	} while (!constraint(text));
	return text;
}