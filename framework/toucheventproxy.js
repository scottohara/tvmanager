function TouchEventProxy(el)
{
	this.element = el;
	this.enabled = true;

	try {
		var testEvent = document.createEvent("TouchEvent");
	} catch (e) {
		this.element.addEventListener("mousedown", this, false);
	}
}

TouchEventProxy.prototype = {
	handleEvent: function(e) {
		switch(e.type) {
			case "mousedown": this.onTouchStart(e); break;
			case "mousemove": this.onTouchMove(e); break;
			case "mouseup": this.onTouchEnd(e); break;
		}
	},

	dispatchTouchEvent: function(e, type) {
		var touchEvent = document.createEvent("Event");
		touchEvent.initEvent(type, true, true);
		touchEvent.targetTouches = [{}];
		//touchEvent.targetTouches[0].clientX = e.clientX;
		touchEvent.targetTouches[0].clientX = 0;
		touchEvent.targetTouches[0].clientY = e.clientY;
		touchEvent.target = e.target;
		touchEvent.timeStamp = e.timeStamp;
		e.target.dispatchEvent(touchEvent);
	},

	onTouchStart: function(e) {
		if (this.enabled ) {
			e.preventDefault();
			this.dispatchTouchEvent(e, "touchstart");
			this.element.addEventListener("mousemove", this, false);
			this.element.addEventListener("mouseup", this, false);
		}

		return false;
	},

	onTouchMove: function(e) {
		this.dispatchTouchEvent(e, "touchmove");
		return false;
	},

	onTouchEnd: function(e) {
		this.element.removeEventListener("mousemove", this, false);
		this.element.removeEventListener("mouseup", this, false);
		this.dispatchTouchEvent(e, "touchend");
		return false;
	}

}