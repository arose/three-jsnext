import { InterpolateDiscrete } from '../../constants';
import { KeyframeTrack } from '../KeyframeTrack';

/**
 *
 * A Track of Boolean keyframe values.
 *
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function BooleanKeyframeTrack ( name, times, values ) {
	this.isBooleanKeyframeTrack = true;

	KeyframeTrack.call( this, name, times, values );

};

BooleanKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrack.prototype ), {

	constructor: BooleanKeyframeTrack,

	ValueTypeName: 'bool',
	ValueBufferType: Array,

	DefaultInterpolation: InterpolateDiscrete,

	InterpolantFactoryMethodLinear: undefined,
	InterpolantFactoryMethodSmooth: undefined

	// Note: Actually this track could have a optimized / compressed
	// representation of a single value and a custom interpolant that
	// computes "firstValue ^ isOdd( index )".

} );


export { BooleanKeyframeTrack };