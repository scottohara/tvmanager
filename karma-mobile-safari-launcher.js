const { execFile } = require("child_process"),
	DEVICE_NAME = "tvm-simulator";

async function simctl(...args) {
	return new Promise((resolve, reject) => {
		execFile("xcrun", ["simctl", ...args], (error, stdout, stderr) => {
			if (null === error) {
				resolve(stdout.trim());
			} else {
				reject(new Error(`simctl ${args[0]} failed: ${stderr.trim()}`));
			}
		});
	});
}

async function deleteDevice() {
	try {
		await simctl("delete", DEVICE_NAME);
	} catch {
		// Nothing to delete
	}
}

function MobileSafari(baseBrowserDecorator, emitter, logger, config) {
	const log = logger.create("launcher:MobileSafari");

	baseBrowserDecorator(this);

	/*
	 * Safari runs inside the simulator rather than as a child process, so
	 * Karma just needs a long-lived process to own (and kill when finished)
	 */
	this._getCommand = () => "/bin/sleep";
	this._getOptions = () => ["1d"];

	/*
	 * A fresh device on every start (including Karma retries), so that a
	 * device that failed to boot doesn't fail the retries as well
	 */
	this.on("start", async (url) => {
		try {
			await deleteDevice();

			const udid = await simctl(
				"create",
				DEVICE_NAME,
				config.deviceType,
				config.runtime,
			);

			log.info(`Booting ${DEVICE_NAME} (${udid})`);
			await simctl("bootstatus", udid, "-b");
			await simctl("openurl", udid, url);
		} catch (error) {
			log.error(error.message);
		}
	});

	emitter.on("exit", async (done) => {
		await deleteDevice();
		done();
	});
}

MobileSafari.prototype.name = "MobileSafari";
MobileSafari.$inject = [
	"baseBrowserDecorator",
	"emitter",
	"logger",
	"config.mobileSafari",
];

module.exports = {
	"launcher:MobileSafari": ["type", MobileSafari],
};
