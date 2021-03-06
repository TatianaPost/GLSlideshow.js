import utils              from './utils.js';
import WebGLRenderer      from './WebGLRenderer.js';
import CanvasRenderer     from './CanvasRenderer.js';
import autoDetectRenderer from './autoDetectRenderer.js';
import { addShader }      from './shaderLib.js';

export default {
	hasCanvas: utils.hasCanvas,
	hasWebGL: utils.hasWebGL,
	autoDetectRenderer,
	WebGLRenderer,
	CanvasRenderer,
	addShader,
};
