import { XHRLoader } from './XHRLoader';
import { DefaultLoadingManager } from './LoadingManager';

/**
 * @author Reece Aaron Lecrivain / http://reecenotes.com/
 */

function AudioLoader ( manager ) {
	this.isAudioLoader = true;

	this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;

};

AudioLoader.prototype = {

	constructor: AudioLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var loader = new XHRLoader( this.manager );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( buffer ) {

			var context = AudioContext;

			context.decodeAudioData( buffer, function ( audioBuffer ) {

				onLoad( audioBuffer );

			} );

		}, onProgress, onError );

	}

};


export { AudioLoader };