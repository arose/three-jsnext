import { InterpolateLinear } from '../../constants';
import { KeyframeTrack } from '../KeyframeTrack';
import { QuaternionLinearInterpolant } from '../../math/interpolants/QuaternionLinearInterpolant';

/**
 *
 * A Track of quaternion keyframe values.
 *
 * @author Ben Houston / http://clara.io/
 * @author David Sarno / http://lighthaus.us/
 * @author tschw
 */

function QuaternionKeyframeTrack ( name, times, values, interpolation ) {
	this.isQuaternionKeyframeTrack = true;

	KeyframeTrack.call( this, name, times, values, interpolation );

};

QuaternionKeyframeTrack.prototype =
		Object.assign( Object.create( KeyframeTrack.prototype ), {

	constructor: QuaternionKeyframeTrack,

	ValueTypeName: 'quaternion',

	// ValueBufferType is inherited

	DefaultInterpolation: InterpolateLinear,

	InterpolantFactoryMethodLinear: function( result ) {

		return new QuaternionLinearInterpolant(
				this.times, this.values, this.getValueSize(), result );

	},

	InterpolantFactoryMethodSmooth: undefined // not yet implemented

} );


export { QuaternionKeyframeTrack };