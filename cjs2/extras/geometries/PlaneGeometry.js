'use strict';

exports.THREE$PlaneGeometry = THREE$PlaneGeometry;

var Geometry = require('../../core/Geometry');
var PlaneBufferGeometry = require('./PlaneBufferGeometry');

/**
 * @author mrdoob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

function THREE$PlaneGeometry ( width, height, widthSegments, heightSegments ) {
	this.isPlaneGeometry = true;

	Geometry.THREE$Geometry.call( this );

	this.type = 'PlaneGeometry';

	this.parameters = {
		width: width,
		height: height,
		widthSegments: widthSegments,
		heightSegments: heightSegments
	};

	this.fromBufferGeometry( new PlaneBufferGeometry.THREE$PlaneBufferGeometry( width, height, widthSegments, heightSegments ) );

};

THREE$PlaneGeometry.prototype = Object.create( Geometry.THREE$Geometry.prototype );
THREE$PlaneGeometry.prototype.constructor = THREE$PlaneGeometry;

THREE$PlaneGeometry.prototype.clone = function () {

	var geometry = new THREE$PlaneGeometry(
		this.parameters.width,
		this.parameters.height,
		this.parameters.widthSegments,
		this.parameters.heightSegments
	);

	return geometry;

};