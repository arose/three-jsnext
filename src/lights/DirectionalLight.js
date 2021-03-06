import { Light } from './Light';
import { DirectionalLightShadow } from './DirectionalLightShadow';
import { Object3D } from '../core/Object3D';

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

function DirectionalLight ( color, intensity ) {
	this.isDirectionalLight = this.isLight = this.isObject3D = true;

	Light.call( this, color, intensity );

	this.type = 'DirectionalLight';

	this.position.set( 0, 1, 0 );
	this.updateMatrix();

	this.target = new Object3D();

	this.shadow = new DirectionalLightShadow();

};

DirectionalLight.prototype = Object.create( Light.prototype );
DirectionalLight.prototype.constructor = DirectionalLight;

DirectionalLight.prototype.copy = function ( source ) {

	Light.prototype.copy.call( this, source );

	this.target = source.target.clone();

	this.shadow = source.shadow.clone();

	return this;

};


export { DirectionalLight };