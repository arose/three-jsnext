import { Light } from './Light';

/**
 * @author mrdoob / http://mrdoob.com/
 */

function AmbientLight ( color, intensity ) {
	this.isAmbientLight = this.isLight = this.isObject3D = true;

	Light.call( this, color, intensity );

	this.type = 'AmbientLight';

	this.castShadow = undefined;

};

AmbientLight.prototype = Object.create( Light.prototype );
AmbientLight.prototype.constructor = AmbientLight;


export { AmbientLight };