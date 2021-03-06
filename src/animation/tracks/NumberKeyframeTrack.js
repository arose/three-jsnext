import { KeyframeTrack } from '../KeyframeTrack';

/**
 *
 * A Track of numeric keyframe values.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function NumberKeyframeTrack ( name, times, values, interpolation ) {
	this.isNumberKeyframeTrack = true;

	KeyframeTrack.call( this, name, times, values, interpolation );

};

NumberKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrack.prototype ), {

	constructor: NumberKeyframeTrack,

	ValueTypeName: 'number',

	// ValueBufferType is inherited

	// DefaultInterpolation is inherited

} );


export { NumberKeyframeTrack };