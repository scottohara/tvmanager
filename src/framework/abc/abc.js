/**
 *
 * Find more about the ABC control at
 * http://cubiq.org/contact-list-on-webkit-for-iphone/8
 *
 * Copyright (c) 2009 Matteo Spinelli
 * Released under the MIT license
 * http://cubiq.org/dropbox/mit-license.txt
 *
 * Version 1.0 - Last updated: 2009.02.12
 *
 */

// SOH: Pass a reference to an element whose first child will be scrolled
function abc(el, scrollEl) {
	this.element = el;
	this.scrollElement = scrollEl;
	this.element.addEventListener('touchstart', this, false);
}

abc.prototype = {
	handleEvent: function(e) {
		switch(e.type) {
			case 'touchstart': this.onTouchStart(e); break;
			case 'touchmove': this.onTouchMove(e); break;
			case 'touchend': this.onTouchEnd(e); break;
		}
	},

	onTouchStart: function(e) {
		e.preventDefault();
		this.element.className = 'hover';

		var theTarget = e.target;
		if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
		theTarget = theTarget.innerText;

		if( document.getElementById(theTarget) )
			this.scrollElement.children(":first").scrollTop(-document.getElementById(theTarget).offsetTop);

		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);

		return false;
	},

	onTouchEnd: function(e) {
		e.preventDefault();
		this.element.className = '';

		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);

		return false;
	},

	onTouchMove: function(e) {
		e.preventDefault();

		var theTarget = document.elementFromPoint(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
		if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;

		theTarget = theTarget.innerText;

		if( document.getElementById(theTarget) ) {
			theTarget = -document.getElementById(theTarget).offsetTop;
			if( theTarget<this.scrollElement.children(":first")[0].scrollHeight )
				theTarget = this.scrollElement.children(":first")[0].scrollHeight;

			this.scrollElement.children(":first").scrollTop(theTarget);
		}

		return false;
	}
}
