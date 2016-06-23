const { basename, dirname, extname, relative, resolve } = require( 'path' );
const { readdirSync, readFileSync } = require( 'sander' );
const { parse } = require( 'acorn' );
const MagicString = require( 'magic-string' );
const attachScopes = require( './ast/attachScopes' );
const walk = require( './ast/walk' );
const createAlias = require( './utils/createAlias' );
const dedupe = require( './utils/dedupe' );
const getKeypath = require( './utils/getKeypath' );
const isExport = require( './utils/isExport' );
const isExportPrototype = require( './utils/isExportPrototype' );

require( 'console-group' ).install();

function isIdentifier ( node, parent ) {
	if ( node.type !== 'Identifier' ) return false;
	if ( parent.type === 'MemberExpression' && !parent.computed && node !== parent.object ) return false;
	if ( parent.type === 'Property' && node !== parent.value ) return false;

	return true;
}

function isClass ( className ) {
	// TODO there may be others... a more robust approach would be
	// to see which instanceof checks are actually used
	return !/^(log|error|warn)$/.test( className );
}

function isIife ( node, parent ) {
	return node.type === 'FunctionExpression' && parent && ( parent.type === 'CallExpression' );
}

const iifeOpen = /\(\s*function\s*\(\s*THREE\s*\)\s*\{[\s\r\n]+/;
const iifeClose = /[\s\r\n]+\}\(\s*THREE\s*\)\s*\);/;

const aliasedExport = /THREE.(\w+) = THREE.(\w+) = function/;

module.exports = class Module {
	constructor ( file ) {
		this.file = file;
		this.dir = dirname( file );

		this.src = readFileSync( file ).toString();

		// special case - ShaderChunk.js. We need to inline all the shaders
		if ( basename( file ) === 'ShaderChunk.js' ) {
			readdirSync( file, '../ShaderChunk' ).forEach( shaderFile => {
				if ( extname( shaderFile ) === '.glsl' ) {
					const name = shaderFile.slice( 0, -5 );
					const definition = JSON.stringify( readFileSync( file, '../ShaderChunk', shaderFile ).toString() );

					this.src += `\nTHREE.ShaderChunk["${name}"] = ${definition};`;
				}
			});
			readdirSync( file, '../ShaderLib' ).forEach( shaderFile => {
				if ( extname( shaderFile ) === '.glsl' ) {
					const name = shaderFile.slice( 0, -5 );
					const definition = JSON.stringify( readFileSync( file, '../ShaderLib', shaderFile ).toString() );

					this.src += `\nTHREE.ShaderChunk["${name}"] = ${definition};`;
				}
			});
		}

		// special case – core/Raycaster.js. Module is wrapped in an IIFE, for some reason
		if ( iifeOpen.test( this.src ) ) {
			this.src = this.src.replace( iifeOpen, '' ).replace( iifeClose, '' ).replace( /^\t/gm, '' );
		}

		// special case – loaders/BinaryTextureLoader.js
		if ( aliasedExport.test( this.src ) ) {
			this.src = this.src.replace( aliasedExport, `var $1 = $2;\nfunction $2` );
		}

		this.magicString = new MagicString( this.src );

		// Attempt to parse with acorn
		try {
			this.ast = parse( this.src );
		} catch ( err ) {
			console.log( this.src );
			console.log( `error parsing ${file}: ${err.message}` );
			throw err;
		}

		this.strongDeps = {};
		this.weakDeps = {};
		this.exports = {};
	}

	analyse ( prototypeChains ) {
		let scope = attachScopes( this.ast );
		let names = scope.names;

		let depth = -1;

		walk( this.ast, {
			enter: ( node, parent ) => {
				if ( node._scope ) {
					if ( !isIife( node, parent ) ) depth += 1;
					scope = node._scope;
				}

				const keypath = getKeypath( node );
				if ( isExport( keypath ) ) {
					// we don't want to treat e.g. `geometry instanceof THREE.Geometry`
					// as a dependency on THREE.Geometry
					if ( parent.type === 'BinaryExpression' && parent.operator === 'instanceof' && node === parent.right ) return;

					if ( depth > 0 ) {
						this.weakDeps[ keypath ] = true;
					} else {
						this.strongDeps[ keypath ] = true;
					}
				}

				// check for assignments to THREE.whatever
				if ( node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' ) {
					const keypath = getKeypath( node.left );

					if ( isExport( keypath ) ) {
						this.exports[ keypath ] = true;
					}

					if ( isExportPrototype( keypath ) ) {
						// capture prototype chain
						if (
							node.right.type === 'CallExpression' &&
							node.right.callee.type === 'MemberExpression' &&
							getKeypath( node.right.callee ) === 'Object.create' &&
							node.right.arguments.length === 1 &&
							node.right.arguments[0].type === 'MemberExpression'
						) {
							const superClass = getKeypath( node.right.arguments[0] );

							if ( !isExportPrototype( superClass ) ) {
								throw new Error( 'WTF? ' + superClass );
							}

							prototypeChains[ keypath ] = superClass;
						}
					}
				}
			},

			leave: ( node, parent ) => {
				if ( node._scope ) {
					if ( !isIife( node, parent ) ) depth -= 1;
					scope = scope.parent;
				}
			}
		});

		Object.keys( this.strongDeps ).forEach( dep => {
			delete this.weakDeps[ dep ];
		});

		Object.keys( this.exports ).forEach( dep => {
			delete this.strongDeps[ dep ];
		});

		this.definitions = this.ast._scope.names.slice();

		// console.group( this.file )
		// console.log( 'strong', Object.keys( this.strongDeps ) );
		// console.log( 'weak', Object.keys( this.weakDeps ) );
		// console.groupEnd();
	}

	render ({ pathByExportName, exportNamesByPath, prototypeChains }) {
		const self = this;
		const magicString = this.magicString;

		let scope = this.ast._scope;
		let varsToDeclare = {};

		walk( this.ast, {
			enter ( node, parent ) {
				if ( node._skip ) return this.skip();

				if ( node._scope ) {
					scope = node._scope;
				}

				// rewrite top-level `this` as `window`
				if ( node.type === 'ThisExpression' && !scope.parent ) {
					magicString.overwrite( node.start, node.end, 'window' );
				}

				// if we encounter `THREE.whatever = ...` it gets turned into
				// `THREE$whatever = ...`, so we need to declare `var THREE$whatever`
				if ( node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' ) {
					const keypath = getKeypath( node.left );

					if ( isExport( keypath ) ) {
						const alias = createAlias( keypath );

						if ( /^THREE\.\w+IdCount$/.test( keypath ) ) {
							magicString.overwrite( node.start, node.end, `var count = 0;\nfunction ${alias} () { return count++; }` );
							return this.skip();
						} else if ( node.right.type === 'FunctionExpression' ) {
							// THREE.Geometry = function () {...} becomes
							// function THREE$Geometry () {...}, to avoid
							// tricky cyclical headaches.
							magicString.overwrite( node.start, node.right.start, '' );
							magicString.insertRight( node.right.start + 8, ' ' + alias );

							// We also add this.isGeometry = true, to avoid
							// instanceof checks
							if ( isClass( alias ) ) {
								let chain = [];
								let proto = `${keypath}.prototype`;
								do {
									chain.push( proto.split( '.' )[1] );
								} while ( proto = prototypeChains[ proto ] );

								const fnBody = node.right.body;
								magicString.insertRight( fnBody.start + 1, `\n\t${chain.map( className => `this.is${className} = `).join( '' )}true;` );
							}

							node.left._skip = true;
							return;
						} else {
							varsToDeclare[ alias ] = true;
						}
					}
				}

				// special case - THREE.GeometryIdCount++ and similar should be rewritten
				// as THREE.GeometryIdCount()...
				if ( node.type === 'UpdateExpression' && node.argument.type === 'MemberExpression' ) {
					const keypath = getKeypath( node.argument );

					if ( /^THREE\.\w+IdCount$/.test( keypath ) ) {
						magicString.overwrite( node.argument.end, node.end, '()' );
					}
				}

				// rewrite all instances of `THREE.whatever` to `THREE$whatever`
				if ( node.type === 'MemberExpression' ) {
					const keypath = getKeypath( node );

					if ( isExport( keypath ) ) {
						const alias = createAlias( keypath );
						magicString.overwrite( node.start, node.end, alias );
					}
				}

				// rewrite `object instanceof THREE.Geometry` to
				// `(object && object .isGeometry)`
				if ( node.type === 'BinaryExpression' && node.operator === 'instanceof' ) {
					if ( node.right.type === 'MemberExpression' ) {
						const keypath = getKeypath( node.right );

						if ( isExport( keypath ) ) {
							const left = magicString.original.slice( node.left.start, node.left.end );
							const name = keypath.slice( 6 );

							magicString.overwrite( node.start, node.end, `(${left} && ${left}.is${name})` );

							node.right._skip = true;
						}
					}
				}
			},

			leave ( node ) {
				if ( node._scope ) {
					scope = scope.parent;
				}
			}
		});

		let strongDependencies = {};
		let weakDependencies = {};

		const addDependency = ( dependencies, owner, name ) => {
			if ( !owner || owner === this.file ) return;

			let relativePath = relative( this.dir, owner ).replace( /\.js$/, '' );
			if ( relativePath[0] !== '.' ) relativePath = `./${relativePath}`;

			if ( !dependencies[ relativePath ] ) {
				dependencies[ relativePath ] = [];
			}

			dependencies[ relativePath ].push( name );
		};

		const addDependencies = ( keypaths, dependencies ) => {
			keypaths.forEach( keypath => {
				const keys = keypath.split( '.' );
				let owner;

				while ( keys.length ) {
					keypath = keys.join( '.' );
					owner = pathByExportName[ keypath ];
					if ( owner ) break;

					keys.pop();
				}

				if ( !owner ) return;

				addDependency( dependencies, owner, createAlias( keypath ) );
			});
		};

		addDependencies( Object.keys( this.strongDeps ), strongDependencies );
		addDependencies( Object.keys( this.weakDeps ).filter( dep => !this.strongDeps[ dep ] ), weakDependencies );

		const varDeclarationBlock = Object.keys( varsToDeclare )
			.map( name => `var ${name};` )
			.join( '\n' );

		if ( varDeclarationBlock ) {
			magicString.prepend( varDeclarationBlock + '\n\n' );
		}

		const importBlock = Object.keys( strongDependencies )
			.map( relativePath => {
				const names = strongDependencies[ relativePath ];
				return `import { ${names.join( ', ' )} } from '${relativePath}';`
			}).concat(
				Object.keys( weakDependencies ).map( relativePath => {
					const names = weakDependencies[ relativePath ];
					return `import { ${names.join( ', ' )} } from '${relativePath}';`
				})
			).join( '\n' );

		if ( importBlock ) {
			magicString.prepend( importBlock + '\n\n' );
		}

		let shouldExport = dedupe(
			exportNamesByPath[ this.file ].map( createAlias )
		);

		const exportBlock = shouldExport.length > 4 ?
			`\n\nexport {\n  ${shouldExport.join(',\n  ')}\n};` :
			shouldExport.length > 0 ?
			`\n\nexport { ${shouldExport.join(', ')} };` :
			'';

		return magicString.append( exportBlock ).toString().trim();
	}
}
