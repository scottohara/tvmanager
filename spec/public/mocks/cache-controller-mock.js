export default class CacheControllerMock {
	constructor(callback) {
		this.callback = callback;
		this.update = sinon.stub();
	}
}