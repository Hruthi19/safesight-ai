"use strict";

const fs = require("fs");
const path = require("path");
const TransformStream = require("stream").Transform;

const dox = require("dox");

class ConcatStream extends TransformStream {
	constructor() {
		super({ objectMode: true });

		this._chunks = [];
	}

	_transform(chunk, encoding, callback) {
		this._chunks.push(chunk);

		callback();
	}

	_flush(callback) {
		this.push(this._chunks.join(""));

		callback();
	}
}

class DoxStream extends TransformStream {
	constructor() {
		super({ objectMode: true, encoding: "utf8" });
	}

	_transform(chunk, encoding, callback) {
		try {
			const docs = dox.parseComments(chunk, { raw: true, skipSingleStar: true });

			docs
				.filter((chunk) => !chunk.ignore && !chunk.isPrivate)
				.forEach((chunk) => {
					this._line(chunk.description.summary);

					if (chunk.tags.length) {
						this._newline();
					}

					chunk.tags.forEach((tag) => {
						switch (tag.type) {
							case "param":
								this._line(`* **@param** _{${ tag.types.join("|") }}_ ${ tag.name } ${ tag.description }`);
								break;
						}
					});

					this._newline();
					this._line(chunk.description.body);
					this._newline();
				});

			callback();
		}
		catch (e) {
			callback(e);
		}
	}

	_line(str) {
		this.push(str);
		this._newline();
	}

	_newline() {
		this.push("\n");
	}
}


const readme = fs.createWriteStream(path.join(__dirname, "README.md"), { encoding: "utf8" });

(async function writeReadme() {
	await writeToReadme(createReadStream(path.join(__dirname, "docs", "header.md")));

	await writeToReadme(createReadStream(path.join(__dirname, "src", "matchers.js"))
		.pipe(new ConcatStream())
		.pipe(new DoxStream()));

	await writeToReadme(createReadStream(path.join(__dirname, "docs", "footer.md")));

	readme.end();
}());

function createReadStream(filename) {
	return fs.createReadStream(filename, { encoding: "utf8" });
}

function writeToReadme(stream) {
	return new Promise((resolve, reject) => {
		stream.on("error", reject);
		readme.once("error", reject);

		stream.on("end", () => {
			readme.off("error", reject);

			resolve();
		});

		stream.pipe(readme, { end: false });
	});
}
