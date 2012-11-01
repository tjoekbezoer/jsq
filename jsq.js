
(function( _exports, _name ) {
	var _regex = new RegExp(
		[
			// (1) unary operator
			'([+]{2}|[-]{2})|',
			// (2) binary operator
			'([=]{2}|(?:!=)|(?:>=)|(?:<=)|[-+*/><])|',
			// (3) assignment operator
			'((?:\\+=)|(?:-=)|(?:\\*=)|(?:/=)|=)|',
			// (4) control character
			'([\\.,:|\\[\\]\\(\\){}])|',
			// (5) variable
			'(\\$[a-z_]+)|',
			// (6) identifier
			'([a-z_]+)|',
			// (7) number
			'(\\d+|(?:\\d+\\.\\d+))|',
			// (8) string. TODO: faster?
			'("(?:\\\\.|[^"])*")|',
			// (9) white space
			'(\\s+)'
		].join(''),
		'gi'
	);
	// The elements in _tokenTypes correlate to the _regexp subpatterns.
	var _tokenTypes = {
			eof: 0,
			op_unary: 1,
			op_binary: 2,
			op_assign: 3,
			ctl: 4,
			var: 5,
			id: 6,
			nr: 7,
			str: 8,
			wsp: 9
		},
		_tokenTypes_length = 9;
	
	var Lexer = function( query ) {
		var lastIndex = 0,
			tokens = [],
			token, i;
		
		while( token = _regex.exec(query) ) {
			// Check if a character was skipped, in which case throw an exception.
			// The lastIndex won't be reset if a exception is thrown, so do it manually.
			if( lastIndex + token[0].length != _regex.lastIndex ) {
				_regex.lastIndex = 0;
				throw 'JSQLexer: Unexpected token at position '+token.index+': '+query.substr(token.index-1,1);
			}
			
			// See what kind of token this is.
			i = 0;
			while( ++i<=_tokenTypes_length && token[i]==void(0) );
			
			tokens.push({
				type: i,
				data: token[0]
			});
			
			lastIndex = _regex.lastIndex;
		}
		
		tokens.push({type:0}); // eof
		this.tokens = tokens;
		
		this.current = 0;
	};
	Lexer.prototype.next = function( num ) {
		this.current += num || 1;
		return this.tokens[this.current] || null;
	};
	Lexer.prototype.peek = function( num ) {
		return this.tokens[this.current+(num||1)] || null;
	};
	// Only useful for testing outside this closure (parser.html)
	Lexer.prototype.type = function( typeId ) {
		for( type in _tokenTypes ) {
			if( _tokenTypes[type] == typeId )
				return type;
		}
		return null;
	};
	
	var Parser = function( query ) {
		this.lexer = new Lexer(query);
		this.structure = {};
		this.path = [];
	};
	Parser.prototype.parse = function() {
		
	};
	
	
	// Public jsq() function
	_exports[_name] = function( data, query, callback, context ) {
		return new Parser(query);
	};
})( typeof exports=='undefined'?this:exports, 'jsq' );