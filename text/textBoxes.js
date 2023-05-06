class MessageManager {
	constructor(font, padding = 50) {
		this.messages = [];
		this.displayText = "";
		this.text = "";
		this.padding = padding;
		this.transition = 0;
		this.target = 1;
		this.font = font;
	}
	
	displayMessage(text) {
		this.messages.push(text);
	}

	nextMessage() {
		this.target = 0;
	}

	showCurrentMessage() {
		if (!this.messages.length)
			return;

		const text = this.messages[0];
		if (this.text !== text) {
			this.text = text;
			this.displayText = "";
		}

		if (this.displayText.length < this.text.length)
			this.displayText += this.text[this.displayText.length];

		const boxWidth = width * 0.7;
		const minBoxHeight = height * 0.15;
		const bottomMargin = height * 0.03;
		
		const { padding } = this;

		const packedText = this.font.packText(this.displayText, boxWidth - padding * 2);
		const contentBoxHeight = padding * 2 + this.font.getTextBounds(packedText).height;

		const boxHeight = Math.max(minBoxHeight, contentBoxHeight);

		const boxCenterY = height - bottomMargin - boxHeight / 2;
		
		const rect = new Rect(0, 0, boxWidth, boxHeight)
			.center(new Vector2(width / 2, Number.lerp(height + boxHeight / 2 + padding, boxCenterY, this.transition)));

		this.transition += 0.12 * (this.target - this.transition);

		if (this.transition < 0.5 && this.target === 0) {
			this.target = 1;
			this.messages.shift();
		}
		
		renderer.draw(Color.BLACK).rect(rect);
		renderer.stroke(Color.WHITE, 4).rect(rect);
		renderer.textMode = TextMode.TOP_CENTER;
		renderer.draw(Color.WHITE).text(this.font, this.displayText, rect.middle.x, rect.min.y + padding, rect.width - padding * 2);
	}
}