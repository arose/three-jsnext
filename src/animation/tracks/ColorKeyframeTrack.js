import { KeyframeTrack } from '../KeyframeTrack';

/**
 *
 * A Track of keyframe values that represent color.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function ColorKeyframeTrack ( name, times, values, interpolation ) {
	this.isColorKeyframeTrack = true;

	KeyframeTrack.call( this, name, times, values, interpolation );

};

ColorKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrack.prototype ), {

	constructor: ColorKeyframeTrack,

	ValueTypeName: 'color'

	// ValueBufferType is inherited

	// DefaultInterpolation is inherited


	// Note: Very basic implementation and nothing special yet.
	// However, this is the place for color space parameterization.

} );


export { ColorKeyframeTrack };