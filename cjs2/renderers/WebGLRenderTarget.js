'use strict';

exports.THREE$WebGLRenderTarget = THREE$WebGLRenderTarget;

var EventDispatcher = require('../core/EventDispatcher');
var Three = require('../Three');
var Vector2 = require('../math/Vector2');
var Math = require('../math/Math');

/**
 * @author szimek / https://github.com/szimek/
 * @author alteredq / http://alteredqualia.com/
 */

function THREE$WebGLRenderTarget ( width, height, options ) {
	this.isWebGLRenderTarget = true;

	this.uuid = Math.THREE$Math.generateUUID();

	this.width = width;
	this.height = height;

	options = options || {};

	this.wrapS = options.wrapS !== undefined ? options.wrapS : Three.THREE$ClampToEdgeWrapping;
	this.wrapT = options.wrapT !== undefined ? options.wrapT : Three.THREE$ClampToEdgeWrapping;

	this.magFilter = options.magFilter !== undefined ? options.magFilter : Three.THREE$LinearFilter;
	this.minFilter = options.minFilter !== undefined ? options.minFilter : Three.THREE$LinearMipMapLinearFilter;

	this.anisotropy = options.anisotropy !== undefined ? options.anisotropy : 1;

	this.offset = new Vector2.THREE$Vector2( 0, 0 );
	this.repeat = new Vector2.THREE$Vector2( 1, 1 );

	this.format = options.format !== undefined ? options.format : Three.THREE$RGBAFormat;
	this.type = options.type !== undefined ? options.type : Three.THREE$UnsignedByteType;

	this.depthBuffer = options.depthBuffer !== undefined ? options.depthBuffer : true;
	this.stencilBuffer = options.stencilBuffer !== undefined ? options.stencilBuffer : true;

	this.generateMipmaps = true;

	this.shareDepthFrom = options.shareDepthFrom !== undefined ? options.shareDepthFrom : null;

};

THREE$WebGLRenderTarget.prototype = {

	constructor: THREE$WebGLRenderTarget,

	setSize: function ( width, height ) {

		if ( this.width !== width || this.height !== height ) {

			this.width = width;
			this.height = height;

			this.dispose();

		}

	},

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( source ) {

		this.width = source.width;
		this.height = source.height;

		this.wrapS = source.wrapS;
		this.wrapT = source.wrapT;

		this.magFilter = source.magFilter;
		this.minFilter = source.minFilter;

		this.anisotropy = source.anisotropy;

		this.offset.copy( source.offset );
		this.repeat.copy( source.repeat );

		this.format = source.format;
		this.type = source.type;

		this.depthBuffer = source.depthBuffer;
		this.stencilBuffer = source.stencilBuffer;

		this.generateMipmaps = source.generateMipmaps;

		this.shareDepthFrom = source.shareDepthFrom;

		return this;

	},

	dispose: function () {

		this.dispatchEvent( { type: 'dispose' } );

	}

};

EventDispatcher.THREE$EventDispatcher.prototype.apply( THREE$WebGLRenderTarget.prototype );