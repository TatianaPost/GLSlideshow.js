/*!
 * @author yomotsu
 * GLSlideshow
 * https://github.com/yomotsu/GLSlideshow
 * Released under the MIT License.
 */
var utils = {

	hasCanvas: function () {

		var canvas = document.createElement('canvas');
		return !!(canvas.getContext && canvas.getContext('2d'));
	}(),

	hasWebGL: function () {

		try {

			var canvas = document.createElement('canvas');
			return !!window.WebGLRenderingContext && !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
		} catch (e) {

			return false;
		}
	}()

};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// based on https://github.com/mrdoob/eventdispatcher.js/

var EventDispatcher = function () {
	function EventDispatcher() {
		_classCallCheck(this, EventDispatcher);

		this._listeners = {};
	}

	EventDispatcher.prototype.addEventListener = function addEventListener(type, listener) {

		var listeners = this._listeners;

		if (listeners[type] === undefined) {

			listeners[type] = [];
		}

		if (listeners[type].indexOf(listener) === -1) {

			listeners[type].push(listener);
		}
	};

	EventDispatcher.prototype.hasEventListener = function hasEventListener(type, listener) {

		var listeners = this._listeners;

		return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	};

	EventDispatcher.prototype.removeEventListener = function removeEventListener(type, listener) {

		var listeners = this._listeners;
		var listenerArray = listeners[type];

		if (listenerArray !== undefined) {

			var index = listenerArray.indexOf(listener);

			if (index !== -1) {

				listenerArray.splice(index, 1);
			}
		}
	};

	EventDispatcher.prototype.dispatchEvent = function dispatchEvent(event) {

		var listeners = this._listeners;
		var listenerArray = listeners[event.type];

		if (listenerArray !== undefined) {

			event.target = this;

			var array = listenerArray.slice(0);

			for (var i = 0, l = array.length; i < l; i++) {

				array[i].call(this, event);
			}
		}
	};

	return EventDispatcher;
}();

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rAF = function () {

	var lastTime = 0;

	if (!!window.requestAnimationFrame) {

		return window.requestAnimationFrame;
	} else {

		return function (callback) {

			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = setTimeout(function () {

				callback(currTime + timeToCall);
			}, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}
}();

/**
 * Primitive Renderer class.
 * @class WebGLRenderer
 * @constructor
 * @param {...(String|Image)} images List of path to image of Image element
 * @param {Object} params
 * @param {Number} params.width
 * @param {Number} params.height
 */

var Renderer = function (_EventDispatcher) {
	_inherits(Renderer, _EventDispatcher);

	function Renderer(images, params) {
		_classCallCheck$1(this, Renderer);

		var _this = _possibleConstructorReturn(this, _EventDispatcher.call(this));

		_this.count = 0;
		_this.startTime = Date.now();
		_this.elapsedTime = 0;
		_this.isRunning = true;
		_this.inTranstion = false;
		_this.duration = params && params.duration || 1000;
		_this.interval = Math.max(params && params.interval || 5000, _this.duration);
		_this.isUpdated = true;
		_this.domElement = params && params.canvas || document.createElement('canvas');
		_this.images = [];

		images.forEach(function (image, i) {
			return _this.insert(image, i);
		});

		return _this;
	}

	Renderer.prototype.transition = function transition(to) {

		this.from.setImage(this.images[this.count]);
		this.to.setImage(this.images[to]);

		this.transitionStartTime = Date.now();
		this.startTime = Date.now();
		this.count = to;
		this.inTranstion = true;
		this.isUpdated = true;
		this.dispatchEvent({ type: 'transitionStart' });
	};

	Renderer.prototype.setSize = function setSize(w, h) {

		if (this.domElement.width === w && this.domElement.height === h) {

			return;
		}

		this.domElement.width = w;
		this.domElement.height = h;
		this.isUpdated = true;
	};

	// setEconomyMode ( state ) {

	// 	// TODO
	// 	// LINEAR_MIPMAP_LINEAR to low
	// 	// lowFPS
	// 	// and othres
	// 	this.isEconomyMode = state;

	// }

	Renderer.prototype.tick = function tick() {

		if (this.isRunning) {

			this.elapsedTime = Date.now() - this.startTime;
		}

		if (this.interval + this.duration < this.elapsedTime) {

			this.transition(this.getNext());
			// transition start
		}

		rAF(this.tick.bind(this));

		if (this.isUpdated) this.render();
	};

	Renderer.prototype.render = function render() {};

	Renderer.prototype.play = function play() {

		if (this.isRunning) return this;

		var pauseElapsedTime = Date.now() - this.pauseStartTime;
		this.startTime += pauseElapsedTime;
		this.isRunning = true;

		delete this._pauseStartTime;
		return this;
	};

	Renderer.prototype.pause = function pause() {

		if (!this.isRunning) return this;

		this.isRunning = false;
		this.pauseStartTime = Date.now();

		return this;
	};

	Renderer.prototype.getCurrent = function getCurrent() {

		return this.count;
	};

	Renderer.prototype.getNext = function getNext() {

		return this.count < this.images.length - 1 ? this.count + 1 : 0;
	};

	Renderer.prototype.getPrev = function getPrev() {

		return this.count !== 0 ? this.count - 1 : this.images.length;
	};

	Renderer.prototype.insert = function insert(image, order) {
		var _this2 = this;

		var onload = function onload(event) {

			_this2.isUpdated = true;
			event.target.removeEventListener('load', onload);
		};

		if (image instanceof Image) {

			image.addEventListener('load', onload);
		} else if (typeof image === 'string') {

			var src = image;
			image = new Image();
			image.addEventListener('load', onload);
			image.src = src;
		} else {

			return;
		}

		this.images.splice(order, 0, image);
	};

	Renderer.prototype.remove = function remove(order) {

		if (this.images.length === 1) {

			return;
		}

		this.images.splice(order, 1);
	};

	Renderer.prototype.replace = function replace(images) {
		var _this3 = this;

		var length = this.images.length;

		images.forEach(function (image) {

			_this3.insert(image, _this3.images.length);
		});

		for (var i = 0 | 0; i < length; i = i + 1 | 0) {

			this.remove(0);
		}

		this.isUpdated = true;
		this.transition(0);
	};

	return Renderer;
}(EventDispatcher);

function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var defaultImage = new Image();
defaultImage.src = 'data:image/gif;base64,R0lGODlhAgACAPAAAP///wAAACwAAAAAAgACAEACAoRRADs=';

/**
 * WebGL Texture class.
 * @class WebGLTexture
 * @constructor
 * @param {Image} image HTMLImageElement
 * @param {WebGLRenderingContext} gl
 */

var WebGLTexture = function (_EventDispatcher) {
	_inherits$1(WebGLTexture, _EventDispatcher);

	function WebGLTexture(image, gl) {
		_classCallCheck$2(this, WebGLTexture);

		var _this = _possibleConstructorReturn$1(this, _EventDispatcher.call(this));

		_this.image = image;

		if (!!gl && gl instanceof WebGLRenderingContext) {

			_this.gl = gl;
			_this.texture = gl.createTexture();
		}

		_this.onload();

		return _this;
	}

	WebGLTexture.prototype.isLoaded = function isLoaded() {

		return this.image.naturalWidth !== 0;
	};

	WebGLTexture.prototype.onload = function onload() {
		var _this2 = this;

		var onload = function onload() {

			_this2.image.removeEventListener('load', onload);
			_this2.setImage(_this2.image);
		};

		if (this.isLoaded()) {

			this.setImage(this.image);
			return;
		}

		this.image.addEventListener('load', onload);
	};

	WebGLTexture.prototype.setImage = function setImage(image) {

		var _gl = this.gl;
		var _image = void 0;

		this.image = image;

		if (this.isLoaded()) {

			_image = this.image;
		} else {

			_image = defaultImage;
			this.onload();
		}

		if (!_gl) {

			this.dispatchEvent({ type: 'updated' });
			return;
		}

		_gl.bindTexture(_gl.TEXTURE_2D, this.texture);
		_gl.pixelStorei(_gl.UNPACK_FLIP_Y_WEBGL, true);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
		_gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
		_gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, _image);
		_gl.bindTexture(_gl.TEXTURE_2D, null);

		this.dispatchEvent({ type: 'updated' });
	};

	return WebGLTexture;
}(EventDispatcher);

// https://gl-transitions.com/

var shaders = {

	crossFade: {
		uniforms: {},
		source: '\nvec4 transition (vec2 uv) {\n\treturn mix( texture2D( from, v ), texture2D( to, v ), progress );;\n}'
	},

	crossZoom: {
		// by https://gl-transitions.com/editor/crosszoom
		uniforms: {
			strength: { value: 0.4, type: 'float' }
		},
		source: '\n// License: MIT\n// Author: rectalogic\n// ported by gre from https://gist.github.com/rectalogic/b86b90161503a0023231\n\n// Converted from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/CrossZoom/CrossZoom.frag\n// Which is based on https://github.com/evanw/glfx.js/blob/master/src/filters/blur/zoomblur.js\n// With additional easing functions from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/Easing/Easing.glsllib\n\nuniform float strength; // = 0.4\n\nconst float PI = 3.141592653589793;\n\nfloat Linear_ease(in float begin, in float change, in float duration, in float time) {\n\treturn change * time / duration + begin;\n}\n\nfloat Exponential_easeInOut(in float begin, in float change, in float duration, in float time) {\n\tif (time == 0.0)\n\t\treturn begin;\n\telse if (time == duration)\n\t\treturn begin + change;\n\ttime = time / (duration / 2.0);\n\tif (time < 1.0)\n\t\treturn change / 2.0 * pow(2.0, 10.0 * (time - 1.0)) + begin;\n\treturn change / 2.0 * (-pow(2.0, -10.0 * (time - 1.0)) + 2.0) + begin;\n}\n\nfloat Sinusoidal_easeInOut(in float begin, in float change, in float duration, in float time) {\n\treturn -change / 2.0 * (cos(PI * time / duration) - 1.0) + begin;\n}\n\nfloat rand (vec2 co) {\n\treturn fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec3 crossFade(in vec2 uv, in float dissolve) {\n\treturn mix(getFromColor(uv).rgb, getToColor(uv).rgb, dissolve);\n}\n\nvec4 transition(vec2 uv) {\n\tvec2 texCoord = uv.xy / vec2(1.0).xy;\n\n\t// Linear interpolate center across center half of the image\n\tvec2 center = vec2(Linear_ease(0.25, 0.5, 1.0, progress), 0.5);\n\tfloat dissolve = Exponential_easeInOut(0.0, 1.0, 1.0, progress);\n\n\t// Mirrored sinusoidal loop. 0->strength then strength->0\n\tfloat strength = Sinusoidal_easeInOut(0.0, strength, 0.5, progress);\n\n\tvec3 color = vec3(0.0);\n\tfloat total = 0.0;\n\tvec2 toCenter = center - texCoord;\n\n\t/* randomize the lookup values to hide the fixed number of samples */\n\tfloat offset = rand(uv);\n\n\tfor (float t = 0.0; t <= 40.0; t++) {\n\t\tfloat percent = (t + offset) / 40.0;\n\t\tfloat weight = 4.0 * (percent - percent * percent);\n\t\tcolor += crossFade(texCoord + toCenter * percent * strength, dissolve) * weight;\n\t\ttotal += weight;\n\t}\n\treturn vec4(color / total, 1.0);\n}\n'
	},

	directionalWipe: {
		// by https://gl-transitions.com/editor/directionalwipe
		uniforms: {
			direction: { value: [1, -1], type: 'vec2' },
			smoothness: { value: 0.4, type: 'float' }
		},
		source: '\n// Author: gre\n// License: MIT\n\nuniform vec2 direction; // = vec2(1.0, -1.0)\nuniform float smoothness; // = 0.5\n\nconst vec2 center = vec2(0.5, 0.5);\n\nvec4 transition (vec2 uv) {\n\tvec2 v = normalize(direction);\n\tv /= abs(v.x)+abs(v.y);\n\tfloat d = v.x * center.x + v.y * center.y;\n\tfloat m =\n\t\t(1.0-step(progress, 0.0)) * // there is something wrong with our formula that makes m not equals 0.0 with progress is 0.0\n\t\t(1.0 - smoothstep(-smoothness, 0.0, v.x * uv.x + v.y * uv.y - (d-0.5+progress*(1.+smoothness))));\n\treturn mix(getFromColor(uv), getToColor(uv), m);\n}\n'
	},

	wind: {
		// by http://transitions.glsl.io/transition/7de3f4b9482d2b0bf7bb
		uniforms: {
			size: { value: 0.2, type: 'float' }
		},
		source: '\n// Author: gre\n// License: MIT\n\n// Custom parameters\nuniform float size; // = 0.2\n\nfloat rand (vec2 co) {\n\treturn fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec4 transition (vec2 uv) {\n\tfloat r = rand(vec2(0, uv.y));\n\tfloat m = smoothstep(0.0, -size, uv.x*(1.0-size) + size*r - (progress * (1.0 + size)));\n\treturn mix(\n\t\tgetFromColor(uv),\n\t\tgetToColor(uv),\n\t\tm\n\t);\n}\n'
	},

	ripple: {
		// by https://gl-transitions.com/editor/ripple
		uniforms: {
			amplitude: { value: 100, type: 'float' },
			speed: { value: 50, type: 'float' }
		},
		source: '\n// Author: gre\n// License: MIT\nuniform float amplitude; // = 100.0\nuniform float speed; // = 50.0\n\nvec4 transition (vec2 uv) {\n\tvec2 dir = uv - vec2(.5);\n\tfloat dist = length(dir);\n\tvec2 offset = dir * (sin(progress * dist * amplitude - progress * speed) + .5) / 30.;\n\treturn mix(\n\t\tgetFromColor(uv + offset),\n\t\tgetToColor(uv),\n\t\tsmoothstep(0.2, 1.0, progress)\n\t);\n}\n'

	},
	pageCurl: {
		// by http://transitions.glsl.io/transition/166e496a19a4fdbf1aae
		uniforms: {},
		source: '\n// author: Hewlett-Packard\n// license: BSD 3 Clause\n// Adapted by Sergey Kosarevsky from:\n// http://rectalogic.github.io/webvfx/examples_2transition-shader-pagecurl_8html-example.html\n\n/*\nCopyright (c) 2010 Hewlett-Packard Development Company, L.P. All rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are\nmet:\n\n\t* Redistributions of source code must retain the above copyright\n\t\tnotice, this list of conditions and the following disclaimer.\n\t* Redistributions in binary form must reproduce the above\n\t\tcopyright notice, this list of conditions and the following disclaimer\n\t\tin the documentation and/or other materials provided with the\n\t\tdistribution.\n\t* Neither the name of Hewlett-Packard nor the names of its\n\t\tcontributors may be used to endorse or promote products derived from\n\t\tthis software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\nLIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\nA PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\nOWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\nSPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\nLIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\nDATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\nTHEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\nin vec2 texCoord;\n*/\n\nconst float MIN_AMOUNT = -0.16;\nconst float MAX_AMOUNT = 1.3;\nfloat amount = progress * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;\n\nconst float PI = 3.141592653589793;\n\nconst float scale = 512.0;\nconst float sharpness = 3.0;\n\nfloat cylinderCenter = amount;\n// 360 degrees * amount\nfloat cylinderAngle = 2.0 * PI * amount;\n\nconst float cylinderRadius = 1.0 / PI / 2.0;\n\nvec3 hitPoint(float hitAngle, float yc, vec3 point, mat3 rrotation)\n{\n\tfloat hitPoint = hitAngle / (2.0 * PI);\n\tpoint.y = hitPoint;\n\treturn rrotation * point;\n}\n\nvec4 antiAlias(vec4 color1, vec4 color2, float distanc)\n{\n\tdistanc *= scale;\n\tif (distanc < 0.0) return color2;\n\tif (distanc > 2.0) return color1;\n\tfloat dd = pow(1.0 - distanc / 2.0, sharpness);\n\treturn ((color2 - color1) * dd) + color1;\n}\n\nfloat distanceToEdge(vec3 point)\n{\n\tfloat dx = abs(point.x > 0.5 ? 1.0 - point.x : point.x);\n\tfloat dy = abs(point.y > 0.5 ? 1.0 - point.y : point.y);\n\tif (point.x < 0.0) dx = -point.x;\n\tif (point.x > 1.0) dx = point.x - 1.0;\n\tif (point.y < 0.0) dy = -point.y;\n\tif (point.y > 1.0) dy = point.y - 1.0;\n\tif ((point.x < 0.0 || point.x > 1.0) && (point.y < 0.0 || point.y > 1.0)) return sqrt(dx * dx + dy * dy);\n\treturn min(dx, dy);\n}\n\nvec4 seeThrough(float yc, vec2 p, mat3 rotation, mat3 rrotation)\n{\n\tfloat hitAngle = PI - (acos(yc / cylinderRadius) - cylinderAngle);\n\tvec3 point = hitPoint(hitAngle, yc, rotation * vec3(p, 1.0), rrotation);\n\tif (yc <= 0.0 && (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0))\n\t{\n\t\treturn getToColor(p);\n\t}\n\n\tif (yc > 0.0) return getFromColor(p);\n\n\tvec4 color = getFromColor(point.xy);\n\tvec4 tcolor = vec4(0.0);\n\n\treturn antiAlias(color, tcolor, distanceToEdge(point));\n}\n\nvec4 seeThroughWithShadow(float yc, vec2 p, vec3 point, mat3 rotation, mat3 rrotation)\n{\n\tfloat shadow = distanceToEdge(point) * 30.0;\n\tshadow = (1.0 - shadow) / 3.0;\n\n\tif (shadow < 0.0) shadow = 0.0; else shadow *= amount;\n\n\tvec4 shadowColor = seeThrough(yc, p, rotation, rrotation);\n\tshadowColor.r -= shadow;\n\tshadowColor.g -= shadow;\n\tshadowColor.b -= shadow;\n\n\treturn shadowColor;\n}\n\nvec4 backside(float yc, vec3 point)\n{\n\tvec4 color = getFromColor(point.xy);\n\tfloat gray = (color.r + color.b + color.g) / 15.0;\n\tgray += (8.0 / 10.0) * (pow(1.0 - abs(yc / cylinderRadius), 2.0 / 10.0) / 2.0 + (5.0 / 10.0));\n\tcolor.rgb = vec3(gray);\n\treturn color;\n}\n\nvec4 behindSurface(vec2 p, float yc, vec3 point, mat3 rrotation)\n{\n\tfloat shado = (1.0 - ((-cylinderRadius - yc) / amount * 7.0)) / 6.0;\n\tshado *= 1.0 - abs(point.x - 0.5);\n\n\tyc = (-cylinderRadius - cylinderRadius - yc);\n\n\tfloat hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n\tpoint = hitPoint(hitAngle, yc, point, rrotation);\n\n\tif (yc < 0.0 && point.x >= 0.0 && point.y >= 0.0 && point.x <= 1.0 && point.y <= 1.0 && (hitAngle < PI || amount > 0.5))\n\t{\n\t\tshado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / (71.0 / 100.0));\n\t\tshado *= pow(-yc / cylinderRadius, 3.0);\n\t\tshado *= 0.5;\n\t}\n\telse\n\t{\n\t\tshado = 0.0;\n\t}\n\treturn vec4(getToColor(p).rgb - shado, 1.0);\n}\n\nvec4 transition(vec2 p) {\n\n\tconst float angle = 30.0 * PI / 180.0;\n\tfloat c = cos(-angle);\n\tfloat s = sin(-angle);\n\n\tmat3 rotation = mat3(\n\t\tc, s, 0,\n\t\t-s, c, 0,\n\t\t0.12, 0.258, 1\n\t);\n\tc = cos(angle);\n\ts = sin(angle);\n\n\tmat3 rrotation = mat3(\n\t\tc, s, 0,\n\t\t-s, c, 0,\n\t\t0.15, -0.5, 1\n\t);\n\n\tvec3 point = rotation * vec3(p, 1.0);\n\n\tfloat yc = point.y - cylinderCenter;\n\n\tif (yc < -cylinderRadius)\n\t{\n\t\t// Behind surface\n\t\treturn behindSurface(p,yc, point, rrotation);\n\t}\n\n\tif (yc > cylinderRadius)\n\t{\n\t\t// Flat surface\n\t\treturn getFromColor(p);\n\t}\n\n\tfloat hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n\n\tfloat hitAngleMod = mod(hitAngle, 2.0 * PI);\n\tif ((hitAngleMod > PI && amount < 0.5) || (hitAngleMod > PI/2.0 && amount < 0.0))\n\t{\n\t\treturn seeThrough(yc, p, rotation, rrotation);\n\t}\n\n\tpoint = hitPoint(hitAngle, yc, point, rrotation);\n\n\tif (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0)\n\t{\n\t\treturn seeThroughWithShadow(yc, p, point, rotation, rrotation);\n\t}\n\n\tvec4 color = backside(yc, point);\n\n\tvec4 otherColor;\n\tif (yc < 0.0)\n\t{\n\t\tfloat shado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / 0.71);\n\t\tshado *= pow(-yc / cylinderRadius, 3.0);\n\t\tshado *= 0.5;\n\t\totherColor = vec4(0.0, 0.0, 0.0, shado);\n\t}\n\telse\n\t{\n\t\totherColor = getFromColor(p);\n\t}\n\n\tcolor = antiAlias(color, otherColor, cylinderRadius - abs(yc));\n\n\tvec4 cl = seeThroughWithShadow(yc, p, point, rotation, rrotation);\n\tfloat dist = distanceToEdge(point);\n\n\treturn antiAlias(color, cl, dist);\n}\n'

	}

};

function getShader(effectName) {

	return shaders[effectName];
}

function addShader(effectName, source, uniforms) {

	shaders[effectName] = {
		uniforms: uniforms,
		source: source
	};
}

function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var vertexShaderSource = '\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUv;\nvoid main() {\n\tgl_Position = vec4( position, 1., 1. );\n\tvUv = uv;\n}\n';

var fragmentShaderSourceHead = '\nprecision highp float;\nvarying vec2 vUv;\nuniform float progress, ratio;\nuniform vec2 resolution;\nuniform sampler2D from, to;\nvec4 getFromColor( vec2 uv ) {\n\treturn texture2D(from, uv);\n}\nvec4 getToColor( vec2 uv ) {\n\treturn texture2D(to, uv);\n}\n';

var fragmentShaderSourceFoot = '\nvoid main(){\n\tgl_FragColor=transition(vUv);\n}\n';

/**
 * WebGL Renderer class.
 * @class WebGLRenderer
 * @constructor
 * @param {...(String|Image)} images List of path to image of Image element
 * @param {Object} params
 * @param {Number} params.width
 * @param {Number} params.height
 * @param {String} params.effect
 */

var WebGLRenderer = function (_Renderer) {
	_inherits$2(WebGLRenderer, _Renderer);

	function WebGLRenderer(images) {
		var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck$3(this, WebGLRenderer);

		var _this = _possibleConstructorReturn$2(this, _Renderer.call(this, images, params));

		_this.context = _this.domElement.getContext('webgl') || _this.domElement.getContext('experimental-webgl');

		_this.resolution = new Float32Array([params.width || _this.domElement.width, params.height || _this.domElement.height]);
		_this.imageAspect = params.imageAspect || _this.resolution[0] / _this.resolution[1];

		_this.vertexShader = _this.context.createShader(_this.context.VERTEX_SHADER);
		_this.context.shaderSource(_this.vertexShader, vertexShaderSource);
		_this.context.compileShader(_this.vertexShader);
		_this.setEffect(params.effect || 'crossFade');
		_this.progress = 0;

		_this.tick();

		return _this;
	}

	WebGLRenderer.prototype.setEffect = function setEffect(effectName) {

		var shader = getShader(effectName);
		var FSSource = fragmentShaderSourceHead + shader.source + fragmentShaderSourceFoot;
		var uniforms = shader.uniforms;
		var i = 0;

		if (this.program) {

			this.context.deleteTexture(this.from.texture);
			this.context.deleteTexture(this.to.texture);
			this.context.deleteBuffer(this.vertexBuffer);
			this.context.deleteShader(this.fragmentShader);
			this.context.deleteProgram(this.program);
		}

		this.fragmentShader = this.context.createShader(this.context.FRAGMENT_SHADER);
		this.context.shaderSource(this.fragmentShader, FSSource);
		this.context.compileShader(this.fragmentShader);

		this.program = this.context.createProgram();
		this.context.attachShader(this.program, this.vertexShader);
		this.context.attachShader(this.program, this.fragmentShader);
		this.context.linkProgram(this.program);
		this.context.useProgram(this.program);

		var canvasAspect = this.resolution[0] / this.resolution[1];
		var aspect = this.imageAspect / canvasAspect;
		var posX = aspect < 1 ? 1.0 : aspect;
		var posY = aspect > 1 ? 1.0 : canvasAspect / this.imageAspect;

		this.vertexBuffer = this.context.createBuffer();
		this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
		this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array([-posX, -posY, posX, -posY, -posX, posY, posX, -posY, posX, posY, -posX, posY]), this.context.STATIC_DRAW);

		var position = this.context.getAttribLocation(this.program, 'position');
		this.context.vertexAttribPointer(position, 2, this.context.FLOAT, false, 0, 0);
		this.context.enableVertexAttribArray(position);

		// uv attr
		this.uvBuffer = this.context.createBuffer();
		this.context.bindBuffer(this.context.ARRAY_BUFFER, this.uvBuffer);
		this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]), this.context.STATIC_DRAW);

		var uv = this.context.getAttribLocation(this.program, 'uv');
		this.context.vertexAttribPointer(uv, 2, this.context.FLOAT, false, 0, 0);
		this.context.enableVertexAttribArray(uv);

		this.uniforms = {
			progress: this.context.getUniformLocation(this.program, 'progress'),
			resolution: this.context.getUniformLocation(this.program, 'resolution'),
			from: this.context.getUniformLocation(this.program, 'from'),
			to: this.context.getUniformLocation(this.program, 'to')
		};

		for (i in uniforms) {

			this.uniforms[i] = this.context.getUniformLocation(this.program, i);
			this.setUniform(i, uniforms[i].value, uniforms[i].type);
		}

		this.from = new WebGLTexture(this.images[this.count], this.context);
		this.to = new WebGLTexture(this.images[this.getNext()], this.context);

		this.from.addEventListener('updated', this.updateTexture.bind(this));
		this.to.addEventListener('updated', this.updateTexture.bind(this));

		this.progress = 0;
		this.setSize(this.resolution[0], this.resolution[1]);
		this.updateTexture();
	};

	WebGLRenderer.prototype.setUniform = function setUniform(key, value, type) {

		var uniformLocation = this.context.getUniformLocation(this.program, key);

		if (type === 'float') {

			this.context.uniform1f(uniformLocation, value);
		} else if (type === 'vec2') {

			this.context.uniform2f(uniformLocation, value[0], value[1]);
		} else if (type === 'vec3') {

			this.context.uniform3f(uniformLocation, value[0], value[1], value[2]);
		} else if (type === 'vec4') {

			this.context.uniform4f(uniformLocation, value[0], value[1], value[2], value[3]);
		}
	};

	WebGLRenderer.prototype.updateTexture = function updateTexture() {

		this.context.activeTexture(this.context.TEXTURE0);
		this.context.bindTexture(this.context.TEXTURE_2D, this.from.texture);
		this.context.uniform1i(this.uniforms.from, 0);

		this.context.activeTexture(this.context.TEXTURE1);
		this.context.bindTexture(this.context.TEXTURE_2D, this.to.texture);
		this.context.uniform1i(this.uniforms.to, 1);

		this.isUpdated = true;
	};

	WebGLRenderer.prototype.setSize = function setSize(w, h) {

		_Renderer.prototype.setSize.call(this, w, h);

		this.domElement.width = w;
		this.domElement.height = h;
		this.resolution[0] = w;
		this.resolution[1] = h;
		this.context.viewport(0, 0, w, h);
		this.context.uniform2fv(this.uniforms.resolution, this.resolution);

		// update vertex buffer
		var canvasAspect = this.resolution[0] / this.resolution[1];
		var aspect = this.imageAspect / canvasAspect;
		var posX = aspect < 1 ? 1.0 : aspect;
		var posY = aspect > 1 ? 1.0 : canvasAspect / this.imageAspect;

		this.context.bindBuffer(this.context.ARRAY_BUFFER, this.vertexBuffer);
		this.context.bufferData(this.context.ARRAY_BUFFER, new Float32Array([-posX, -posY, posX, -posY, -posX, posY, posX, -posY, posX, posY, -posX, posY]), this.context.STATIC_DRAW);

		this.isUpdated = true;
	};

	WebGLRenderer.prototype.render = function render() {

		if (this.inTranstion) {

			var transitionElapsedTime = Date.now() - this.transitionStartTime;
			this.progress = this.inTranstion ? Math.min(transitionElapsedTime / this.duration, 1) : 0;

			// this.context.clearColor( 0, 0, 0, 1 );
			this.context.uniform1f(this.uniforms.progress, this.progress);
			this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
			this.context.drawArrays(this.context.TRIANGLES, 0, 6);
			this.context.flush();

			if (this.progress === 1) {

				this.inTranstion = false; // may move to tick()
				this.isUpdated = false;
				this.dispatchEvent({ type: 'transitionEnd' });
				// transitionEnd!
			}
		} else {

			// this.context.clearColor( 0, 0, 0, 1 );
			this.context.uniform1f(this.uniforms.progress, this.progress);
			this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
			this.context.drawArrays(this.context.TRIANGLES, 0, 6);
			this.context.flush();
			this.isUpdated = false;
		}
	};

	WebGLRenderer.prototype.dispose = function dispose() {

		this.isRunning = false;
		this.inTranstion = false;

		this.tick = function () {};
		this.setSize(1, 1);

		if (this.program) {

			this.context.activeTexture(this.context.TEXTURE0);
			this.context.bindTexture(this.context.TEXTURE_2D, null);
			this.context.activeTexture(this.context.TEXTURE1);
			this.context.bindTexture(this.context.TEXTURE_2D, null);
			this.context.bindBuffer(this.context.ARRAY_BUFFER, null);
			// this.context.bindBuffer( this.context.ELEMENT_ARRAY_BUFFER, null );
			// this.context.bindRenderbuffer( this.context.RENDERBUFFER, null );
			// this.context.bindFramebuffer( this.context.FRAMEBUFFER, null );

			this.context.deleteTexture(this.from.texture);
			this.context.deleteTexture(this.to.texture);
			this.context.deleteBuffer(this.vertexBuffer);
			// this.context.deleteRenderbuffer( ... );
			// this.context.deleteFramebuffer( ... );
			this.context.deleteShader(this.vertexShader);
			this.context.deleteShader(this.fragmentShader);
			this.context.deleteProgram(this.program);
		}

		if (!!this.domElement.parentNode) {

			this.domElement.parentNode.removeChild(this.domElement);
		}

		delete this.from;
		delete this.to;
		delete this.domElement;
	};

	return WebGLRenderer;
}(Renderer);

function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn$3(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Canvas Renderer class.
 * @class CanvasRenderer
 * @constructor
 * @param {...(String|Image)} images List of path to image of Image element
 * @param {Object} params
 * @param {Number} params.width
 * @param {Number} params.height
 */

var CanvasRenderer = function (_Renderer) {
	_inherits$3(CanvasRenderer, _Renderer);

	function CanvasRenderer(images, params) {
		_classCallCheck$4(this, CanvasRenderer);

		var _this = _possibleConstructorReturn$3(this, _Renderer.call(this, images, params));

		_this.context = _this.domElement.getContext('2d');

		_this.from = new WebGLTexture(_this.images[_this.count]);
		_this.to = new WebGLTexture(_this.images[_this.getNext()]);

		_this.from.addEventListener('updated', _this.updateTexture.bind(_this));
		_this.to.addEventListener('updated', _this.updateTexture.bind(_this));

		_this.setSize(params.width || _this.domElement.width, params.height || _this.domElement.height);
		_this.tick();

		return _this;
	}

	CanvasRenderer.prototype.updateTexture = function updateTexture() {

		this.isUpdated = true;
	};

	CanvasRenderer.prototype.render = function render() {

		var width = this.domElement.width;
		var height = this.domElement.height;

		if (this.inTranstion) {

			var transitionElapsedTime = Date.now() - this.transitionStartTime;
			var progress = this.inTranstion ? Math.min(transitionElapsedTime / this.duration, 1) : 0;

			if (progress !== 1) {

				this.context.drawImage(this.from.image, 0, 0, width, height);
				this.context.globalAlpha = progress;
				this.context.drawImage(this.to.image, 0, 0, width, height);
				this.context.globalAlpha = 1;
			} else {

				this.context.drawImage(this.to.image, 0, 0, width, height);
				this.inTranstion = false; // may move to tick()
				this.isUpdated = false;
				this.dispatchEvent({ type: 'transitionEnd' });
				// transitionEnd!
			}
		} else {

			this.context.drawImage(this.images[this.count], 0, 0, width, height);
			this.isUpdated = false;
		}
	};

	CanvasRenderer.prototype.dispose = function dispose() {

		this.isRunning = false;
		this.inTranstion = false;

		this.tick = function () {};

		this.setSize(1, 1);

		if (!!this.domElement.parentNode) {

			this.domElement.parentNode.removeChild(this.domElement);
		}

		delete this.from;
		delete this.to;
		delete this.domElement;
	};

	return CanvasRenderer;
}(Renderer);

var autoDetectRenderer = (function (images, params) {

	if (!utils.hasCanvas) {

		// your browser is not available both canvas and webgl
		return;
	}

	if (!utils.hasWebGL) {

		return new CanvasRenderer(images, params);
	}

	return new WebGLRenderer(images, params);
});

var GLSlideshow = {
	hasCanvas: utils.hasCanvas,
	hasWebGL: utils.hasWebGL,
	autoDetectRenderer: autoDetectRenderer,
	WebGLRenderer: WebGLRenderer,
	CanvasRenderer: CanvasRenderer,
	addShader: addShader
};

export default GLSlideshow;
