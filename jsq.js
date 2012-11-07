
(function( _exports, _name ) {
	var debug = function() {
		console.log.apply(console, arguments);
	};
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
			'(\\$[a-z_][a-z0-9_]*)|',
			// (6) identifier
			'([a-z_][a-z0-9_]*)|',
			// (7) float
			'(\\d+\\.\\d+)|',
			// (8) integer
			'(\\d+)|',
			// (9) string. TODO: faster?
			'("(?:\\\\.|[^"])*")|',
			// (10) white space
			'(\\s+)'
		].join(''),
		'gi'
	);
	// The elements in _tokenTypes correlate to the _regexp subpatterns.
	var _tokenTypes,
		_t = _tokenTypes = {
			op_unary: 1,
			op_binary: 2,
			op_assign: 3,
			ctl: 4,
			var: 5,
			id: 6,
			flt: 7,
			int: 8,
			str: 9,
			wsp: 10
		};
	
	//function _error( msg )
	
	var Lexer = function( query ) {
		var lastIndex = 0,
			tokens = [],
			token, i;
		
		while( token = _regex.exec(query) ) {
			// Check if a character was skipped, in which case throw an exception.
			// The lastIndex won't be reset if an exception is thrown, so do it manually.
			if( lastIndex + token[0].length != _regex.lastIndex ) {
				_regex.lastIndex = 0;
				throw 'jsq_lexer: Unexpected token '+query.substr(token.index-1,1)+' at position '+token.index;
			}
			
			// See what kind of token this is, and add it to the stack.
			// This line is based on the fact that token will always return an array like
			// [matched string, [subpattern, ...]], so in this case 10 elements after the
			// matched string.
			i = 0; while( ++i<=10 && token[i]==void(0) );
			tokens.push({
				type: i,
				index: _regex.lastIndex,
				data: token[0]
			});
			
			lastIndex = _regex.lastIndex;
		}
		
		this.tokens = tokens;
		this.i = 0;
	};
	Lexer.prototype.current = function() {
		return this.tokens[this.i] || null;
	};
	Lexer.prototype.eof = function() {
		return this.i+1 >= this.tokens.length;
	};
	Lexer.prototype.next = function( num ) {
		this.i += num || 1;
		return this.tokens[this.i] || null;
	};
	Lexer.prototype.peek = function( num ) {
		return this.tokens[this.i+(num||1)] || null;
	};
	Lexer.prototype.reset = function() {
		this.i = 0;
	};
	Lexer.prototype.skip = function( returnNext ) {
		var t;
		while( (t = this.peek()) && t.type == _t.wsp )
			this.next();
		
		return (returnNext && this.next()) || !this.eof();
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
		// Unique ID for every branch
		this.id = 0;
		this.tokens = new Lexer(query);
		this.tree = {
			id: this.id++,
			name: 'program',
			parent: null,
			index: 0,
			children: []
		};
		this.current = this.tree;
	};
	Parser.prototype.add = function( name ) {
		var d;
		if( name instanceof Object ) {
			d = name;
			d.parent = this.current;
		} else {
			d = {
				id: this.id++,
				name: name,
				parent: this.current,
				index: 0,
				children: []
			};
		}
		d.index = this.current.children.push(d)-1;
		return this.current = d;
	};
	// parse() is the root parse method.
	Parser.prototype.parse = function() {
		var branchId = this.current.id,
			token;
		
		while( token = this.tokens.current() ) {
			switch( token.data ) {
				case '.':
					this.parse_query();
					break;
				case '(':
					this.add('parens');
					this.tokens.next();
					this.parse();
					break;
				case ')':
					if( this.current.name != 'parens' && this.current.name != 'pipe' )
						throw 'jsq_parse: Unexpected ) at position '+token.index;
					this.up();
					break;
				case ',':
					this.parse_comma();
					break;
				case '|':
					this.parse_pipe();
					break;
				default:
					switch( token.type ) {
						case _t.wsp:
							this.tokens.next();
							continue;
						case _t.id:
							this.parse_id();
							break;
						case _t.flt:
						case _t.int:
						case _t.str:
							this.parse_literal();
							break;
						default:
							throw 'jsq_parse: Unrecognized \''+token.data+'\' at position '+token.index;
					}
						
			}
			
			// If this is a subroutine of parse(), break out when
			// were back in the branch where it was called
			if( this.current.id && this.current.id == branchId )
				return;
			
			this.tokens.next();
		}
		
		if( this.tokens.eof() && this.current.name != 'program' )
			throw 'jsq_parse: Unexpected EOF';
		
		return this;
	};
	// parse_comma() parses the entire collection, contrary to what e.g. parse_pipe() does.
	// This is because a comma collection can only exist of query expressions in the root
	// branch or nested inside an array, object or parens. Collections cannot be nested.
	Parser.prototype.parse_comma = function() {
		var first, peek, token;
		
		if( this.current.children[0].name != 'query' )
			throw 'jsq_parse_comma: Unexpected , at position '+this.tokens.current().index;	
		
		if( this.current.name != 'comma' ) {
			this.wrap('comma');
			
			// Now parse the rest of the comma structure
			while( true ) {
				token = this.tokens.skip(true);
				if( token && token.data == '.' ) {
					this.parse_query();
					
					this.tokens.skip();
					token = this.tokens.peek();
					if( !token ) {
						break;
					}
					else if(
						token.data == ','
					) {
						this.tokens.next();
						continue;
					} else if(
						token.data == ')' ||
						token.data == '}' ||
						token.data == ']' ||
						token.data == '|'
					) {
						break;
					}
				}
				
				if( token )
					throw 'jsq_parse_comma: Unexpected \''+token.data+'\' at position '+token.index;
				else
					throw 'jsq_parse_comma: Unexpected EOF';
			}
			
			this.up();
		}
	};
	Parser.prototype.parse_id = function() {
		var token = this.tokens.current();
		
		this.add('function_call').value = token.data;
		this.up();
	};
	Parser.prototype.parse_literal = function() {
		var token = this.tokens.current();
		
		this.add('literal').value = token.data;
		
		if( this.current.parent.name != 'binary' &&
			this.current.index
		)
			throw 'jsq_parse_literal: Unexpected \''+token.data+'\' at position '+token.index;
		
		this.up();
	};
	Parser.prototype.parse_pipe = function() {
		if( this.current.name != 'pipe' )
			this.wrap('pipe');
		
		this.tokens.next();
		this.parse();
		this.up();
	};
	Parser.prototype.parse_query = function() {
		var token, peek, d;
		
		this.add('query');
		
		// This query must be the start of the expression,
		// or follow a comma or pipe.
		if( this.current.index && !(
				this.current.parent.name == 'comma' ||
				this.current.parent.name == 'pipe'
			)
		) {
			throw 'jsq_parse_query: Unexpected . at position '+this.tokens.current().index;
		}
		
		while(
			(peek = this.tokens.peek()) &&
			peek.type != _t.wsp &&
			peek.data != ')' &&
			peek.data != '}' &&
			peek.data != ']' &&
			peek.data != '|' &&
			peek.data != ','
		) {
			token = this.tokens.next();
			if(
				token.data == '['
			) {
				token = this.tokens.next();
				if(
					token && (
						token.type == _t.var ||
						token.type == _t.id ||
						token.type == _t.int ||
						token.type == _t.str
					)
				) {
					d = this.add('key_name');
					d.value = token.data;
					this.up();
					
					token = this.tokens.next();
					if( token && token.data == ']' )
						continue;
				} else if(
					token &&
					token.data == ']'
				) {
					this.add('key_all');
					this.up();
					continue;
				}
			}
			
			if( token )
				throw 'jsq_parse_query: Unexpected \''+token.data+'\' at position '+token.index;
			else
				throw 'jsq_parse_query: Unexpected EOF';
		}
		
		this.up();
	};
	Parser.prototype.up = function( num ) {
		if( this.current.parent ) {
			if( --num > 0 )
				this.up(num);
			return this.current = this.current.parent;
		} else {
			throw 'jsq_up: Fatal internal error. Bug?';
		}
	};
	// Say you have:
	//    program > query
	// Now when you do wrap('comma'):
	//    program > comma > query
	Parser.prototype.wrap = function( name ) {
		var first;
		
		if( !this.current.children.length || this.current.children.length > 1 )
			throw 'jsq_wrap: Unexpected '+this.tokens.current().data+' at position '+this.tokens.current().index;
		
		first = this.current.children.shift();
		this.add(name);
		this.add(first);
		this.up();
	};
	
	
	// Public jsq() function
	var jsq = function( data, query, callback, context ) {
		var parser = new Parser(query);
		parser.parse();
		
		return parser;
	};
	jsq.Lexer = Lexer;
	jsq.Parser = Parser;
	
	_exports[_name] = jsq;
})(typeof exports=='undefined'?this:exports, 'jsq');