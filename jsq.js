
/** @define {boolean} */
var DEV = true;

;(function( window ) {
	
	function _concat( array1, array2 ) {
		if( !(array1 instanceof Array) )
			array1 = [array1];
		if( !(array2 instanceof Array) )
			array2 = [array2];
		return array1.concat(array2);
	}
	// Deep copy for simple objects and array
	function _copy( target ) {
		if( !(target instanceof Object) )
			return target;
		
		var result = new target.constructor;
		_each(target, function( val, key ) {
			result[key] = _copy(val);
		});
		return result;
	}
	function _each( obj, iterator ) {
		if( obj instanceof Array ) {
			for( var i = 0, l = obj.length; i < l; i++ ) {
				if( iterator(obj[i], i, obj) === false ) return false;
			}
		} else if( obj instanceof Object ) {
			for( var key in obj ) {
				if( iterator(obj[key], key, obj) === false ) return false;
			}
		}
		
		return true;
	}
	// Extend target object with the properties from the given source objects.
	function _extend( target /*[, source]...*/ ) {
		for( var i=1; i<arguments.length; i++ ) {
			if( arguments[i] instanceof Object ) {
				for( var key in arguments[i] ) {
					target[key] = arguments[i][key];
				}
			}
		}
		return target;
	}
	// Returns highest found index of value, or -1 if not found.
	function _indexOf( array, value ) {
		for( var i=array.length-1; i>=0; i-- ) {
			if( array[i] === value )
				return i;
		}
		return -1;
	}
	// Returns an object's keys in sorted order.
	function _keys( obj ) {
		var result = [];
		for( var key in obj )
			result.push(key);
		return result.sort();
	}
	function _compare(a, b) {
		// Copy arguments to avoid IE<=8 bug? (http://www.zachleat.com/web/array-sort)
		var atype = _compare.typ(a), btype = _compare.typ(b);
		if( atype != btype ) {
			return _compare.types[atype] - _compare.types[btype];
		} else if( a instanceof Array ) {
			// Arrays are compared in sorted order. A shorter array is always
			// considered smaller.
			if( a.length != b.length )
				return a.length - b.length;
			
			var i, result;
			for( i=0; i<a.length; i++ ) {
				result = _compare(a[i], b[i]);
				if( result != 0 ) return result;
			}
			return 0;
		} else if( a instanceof Object ) {
			// Objects are first compared by keys. If they're equal, compare by values.
			// Comparison is performed by sorted key order.
			var akeys = _keys(a)
				, bkeys = _keys(b)
				, result = _compare(akeys, bkeys);
			if( result == 0 )
				return _compare(_values(a, akeys), _values(b, bkeys));
			return result;
		} else if( atype == 'string' ) {
			return a>b?1:(a===b?0:-1); //a.localeCompare(b);
		} else {
			return a-b;
		}
	}
	_compare.typ = function( val ) {
		return	val instanceof Array && 'array' ||
						val === null && 'null' ||
						typeof val;
	};
	_compare.types = {
		'null': 1,
		'boolean': 2,
		'number': 3,
		'string': 4,
		'array': 5,
		'object': 6
	};
	// Used in _binary to detect object comparisons.
	function _scalar( mixed ) {
		return	typeof mixed == 'number' && 'number' ||
						typeof mixed == 'string' && 'string' ||
						typeof mixed == 'boolean' && 'boolean' ||
						typeof mixed == 'undefined' && 'undefined' ||
						false;
	}
	// Replaces %# in a string with the (#+1)th argument.
	function _sprintf( str /* ,replacement... */ ) {
		var args = Array.prototype.slice.call(arguments, 1);
		return typeof str == 'string' && str.replace(/%(\d+)/g, function(match, i) { 
			return args[i] || '';
		});
	};
	function _values( obj, keys ) {
		var result = [];
		keys || (keys = _keys(obj));
		for( var i=0; i<keys.length; i++ )
			result.push(obj[keys[i]]);
		return result;
	}
	// When target is an object: return a shallow copy of target from which all keys
	// also existing in source are removed. Both arguments have to be objects.
	// When target is an array: return a copy of target where all values also existing in
	// source are removed. In this case, source can also be a scalar value.
	function _without( target, source ) {
		if( target instanceof Array ) {
			if( !(source instanceof Array) )
				source = [source];
			target = target.slice(0);
			// Exclude values found in the source array
			for( var i=0; i<source.length; i++ ) {
				for( var j=0; j<target.length; j++ ) {
					if( target[j] === source[i] ) {
						target.splice(j, 1);
						i--;
					}
				}
			}
		} else if( target instanceof Object && source instanceof Object ) {
			target = _extend({}, target);
			// Exclude keys found in the source object
			for( var key in source ) {
				for( var key_target in target ) {
					if( key_target == key )
						delete target[key_target];
				}
			}
		} else {
			// target is neither object nor array
			target = null;
		}
		
		return target;
	}
	
	// `which` is 'max', or 'min' -- Used in jsq.fn.min/max.
	// If an argument is supplied, run it for each input element.
	function _extreme( which, input, argument, undefined ) {
		if( input instanceof Array && !argument ) {
			return Math[which].apply(Math, input);
		} else if( input instanceof Object ) {
			var max, obj;
			_each(input, function( el ) {
				var val = argument ? _expression([el], [], argument)[0] : el;
				if( val === undefined ) return;
				
				if( max === undefined || Math[which](max, val) == val ) {
					max = val;
					if( argument ) obj = el;
				}
			});
			return argument ? obj : max;
		} else {
			return input;
		}
	}
	
	var _hasOwnProperty = ({}).hasOwnProperty;
	
	var _regex = new RegExp(
		[
			// (1) unary operator
			'(!(?!=)|~)|',
			// (2) comparison operator
			'(&&|\\|\\||===|==|!=|>=|<=|<|>)|',
			// (3) assignment operator
			'(as(?= )|=|\\|=|\\+=|-=|\\*=|/=)|',
			// (4) arithmetic operator
			'([-+*/]|and|or|xor)|',
			// (5) control character
			'([\\.,:|\\[\\]\\(\\){}])|',
			// (6) boolean
			'(true|false)|',
			// (7) null
			'(null)|',
			// (8) undefined
			'(undefined)|',
			// (9) variable
			'(\\$[a-z_][a-z0-9_]*)|',
			// (10) identifier
			'([a-z_][a-z0-9_]*)|',
			// (11) float
			'(\\d+\\.\\d+)|',
			// (12) integer
			'(\\d+)|',
			// (13) string. TODO: single quotes
			'("(?:\\\\.|[^"])*")|',
			// (14) white space
			'(\\s+)'
		].join(''),
		'gi'
	);
	// Token types.
	// The elements in _t correlate to the _regexp subpatterns.
	var _t = {
		op_uny:	1,
		op_cmp:	2,
		op_ass:	3,
		op_arm:	4,
		ctl:		5,
		bln:		6,
		nil:		7,
		udf:		8,
		vrb:		9,
		id:			10,
		flt:		11,
		itg:		12,
		str:		13,
		wsp:		14
	};
	// Types of parser branches.
	var ARGUMENT = 				DEV && "argument" || 1
		, ASSIGNMENT = 			DEV && "assignment" || 2
		, BINARY = 					DEV && "binary" || 3
		, BOOL = 						DEV && "bool" || 4
		, COLLECT = 				DEV && "collect" || 5
		, ELEMENT = 				DEV && "element" || 6
		, FILTER = 					DEV && "filter" || 7
		, FUNCTION_CALL = 	DEV && "function_call" || 8
		, KEY = 						DEV && "key" || 9
		, KEY_ALL = 				DEV && "key_all" || 10
		, LIST = 						DEV && "list" || 11
		, NAME = 						DEV && "name" || 12
		, NIL = 						DEV && "null" || 13
		, NUMBER = 					DEV && "number" || 14
		, OBJECT = 					DEV && "object" || 15
		, OPERATOR = 				DEV && "operator" || 16
		, PARENS = 					DEV && "parens" || 17
		, PIPE = 						DEV && "pipe" || 18
		, PROGRAM = 				DEV && "program" || 19
		, STRING = 					DEV && "string" || 20
		, TARGET = 					DEV && "target" || 21
		, UNARY = 					DEV && "unary" || 22
		, UNDEFINED = 			DEV && "undefined" || 23
		, VALUE = 					DEV && "value" || 24
		, VARIABLE = 				DEV && "variable" || 25
	
	// Error messages.
	var _e = {
		EOF: 'Unexpected EOF',
		UNEXPECTED_TOKEN: 'Unexpected \'%0\' at position %1',
		UNRECOGNIZED_TOKEN: 'Unrecognized token \'%0\' at position %1'
	};
	function _error( str ) {
		if( !str ) str = 'Unknown error';
		throw _sprintf.apply(this, arguments);
	}
	
	var Lexer = function( query ) {
		var lastIndex = 0,
			tokens = [],
			token, i;
		
		while( token = _regex.exec(query) ) {
			// Check if a character was skipped, in which case throw an exception.
			// The lastIndex won't be reset if an exception is thrown, so do it manually.
			if( lastIndex + token[0].length != _regex.lastIndex ) {
				_regex.lastIndex = 0;
				_error(_e.UNRECOGNIZED_TOKEN, query.substr(token.index-1,1), token.index);
			}
			
			// See what kind of token this is, and add it to the stack.
			// This line is based on the fact that `token` will always return an array like
			// [matched string, [subpattern, ...]], so in this case 11 elements after the
			// matched string.
			i = 0; while( ++i<=14 && token[i]===void(0) ){}
			if( i == _t.str )
				token[0] = token[0].slice(1,-1);
			// Add token.
			tokens.push({
				type: i,
				index: _regex.lastIndex,
				val: token[0]
			});
			
			lastIndex = _regex.lastIndex;
		}
		
		this.tokens = tokens;
		this.i = 0;
	};
	DEV && (Lexer.tokenTypes = _t);
	// Look back `num` non-whitespace tokens without moving the cursor.
	Lexer.prototype.back = function( num ) {
		var i = this.i, token;
		num = num>0 ? num : 1;
		while( num-- )
			while( --i>=0 && (token = this.tokens[i]).type == _t.wsp ) {}
		return token && (token.type != _t.wsp ? this.tokens[i] : false) || false;
	};
	Lexer.prototype.current = function() {
		return this.tokens[this.i] || null;
	};
	Lexer.prototype.next = function( num ) {
		this.i += num || 1;
		return this.tokens[this.i] || null;
	};
	Lexer.prototype.eof = function() {
		return this.i+1 >= this.tokens.length;
	};
	Lexer.prototype.peek = function( skip ) {
		var num = this.i + 1;
		while( skip && this.tokens[num] && this.tokens[num].type == _t.wsp )
			num++;
		return this.tokens[num] || null;
	};
	// Set the cursor num||1 tokens back.
	Lexer.prototype.prev = function( num ) {
		this.i -= num || 1;
		return this.tokens[this.i] || (this.i=0) || null;
	};
	Lexer.prototype.skip = function( returnNext ) {
		var t;
		while( (t = this.peek()) && t.type == _t.wsp )
			this.next();
		
		return (returnNext && this.next()) || !this.eof();
	};
	
	
	var Parser = function( query ) {
		// Unique ID for every branch
		this.id = 0;
		this.tokens = new Lexer(query);
		this.tree = this.add(PROGRAM);
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
				// value: null,
				parent: this.current,
				index: 0,
				children: [],
				last: null
			};
		}
		if( this.current ) {
			d.index = this.current.children.push(d)-1;
			this.current.last = d;
		}
		return this.current = d;
	};
	Parser.prototype.addup = function( name ) {
		var ret = this.add(name);
		this.up();
		return ret;
	};
	// parse() is the root parse method.
	Parser.prototype.parse = function() {
		var branchId = this.current.id,
			token;
		
		while( token = this.tokens.current() ) {
			switch( token.type ) {
				case _t.op_uny:
					this.parse_unary();
					break;
				case _t.op_arm:
				case _t.op_cmp:
					this.parse_binary();
					break;
				case _t.op_ass:
					this.parse_assignment(token);
					break;
				case _t.bln:
					this.addup(BOOL).val = token.val;
					break;
				case _t.nil:
					this.addup(NIL);
					break;
				case _t.udf:
					this.addup(UNDEFINED);
					break;
				case _t.vrb:
					this.parse_variable();
					break;
				case _t.id:
					this.parse_function();
					break;
				case _t.flt:
				case _t.itg:
				case _t.str:
					this.parse_literal();
					break;
				case _t.wsp:
					this.tokens.next();
					continue;
				default:
					switch( token.val ) {
						case '.':
							this.parse_filter();
							break;
						case '(':
							this.parse_parens();
							break;
						case '[':
							this.parse_collection();
							break;
						case '{':
							this.parse_object();
							break;
						case ',':
							this.parse_list();
							break;
						case '|':
							this.parse_pipe();
							break;
						default:
							_error(_e.UNRECOGNIZED_TOKEN, token.val, token.index);
					}
			}
			// If this is a subroutine of parse(), break out when
			// we're back in the branch where it was called
			if( this.current.id && this.current.id == branchId )
				return;
			
			this.tokens.next();
		}
		
		if( this.tokens.eof() && this.current.name != PROGRAM )
			_error(_e.EOF);
		
		return this;
	};
	Parser.prototype.parse_assignment = function( opToken ) {
		var token = this.tokens.skip(true),
				num = 1;
		
		// If assignment follows a pipe, take the end of the pipe
		// as the value for the assignment. Otherwise the entire pipe
		// would be taken as input, producing unexpected results.
		if( this.current.last.name == PIPE ) {
			this.current = this.current.last;
			num = 2;
		}
		
		this.wrap(ASSIGNMENT);
		switch( opToken.val ) {
			case 'as':
				if( token && token.type == _t.vrb )
					this.addup(NAME).val = token.val;
				break;
			case '=':
			case '|=':
			case '+=':
			case '-=':
			case '*=':
			case '/=':
				if( this.current.last.name != FILTER )
					_error(_e.UNEXPECTED_TOKEN, opToken.val, opToken.index);
				if( opToken.val != '=' && opToken.val != '|=' ) {
					// Shorthand op for x |= . op filter
					this.addup(OPERATOR).val = '|='
					this.add(BINARY);
					this.add(FILTER);
					this.addup(TARGET).val = '.';
					this.up();
					this.addup(OPERATOR).val = opToken.val.substr(0,1);
					this.parse();
					this.up();
				} else {
					// = or |=
					this.addup(OPERATOR).val = opToken.val;
					this.parse();
				}
				break;
		}
		this.up(num);
	};
	// A binary is two expressions combined by an arithmetic- or a comparison operator.
	// Binaries can be chained, where execution precedence is taken into account as per
	// the normal arithmetic rules.
	Parser.prototype.parse_binary = function( lhs ) {
		var token = this.tokens.current()
			, lhs = lhs || this.current.last
			, prev, op;
		
		if(
			lhs && (
				lhs.name == PIPE ||
				// Value assignment, eg.: .foo=1 or .foo|=.[0]
				lhs.name == ASSIGNMENT && lhs.children.length == 3 ||
				token.type == _t.op_arm && lhs.name == LIST ||
				// The left hand side is a binary, so it has 3 children:
				// a lhs, an operator and a rhs. Perform an action based on
				// its operator.
				lhs.name == BINARY &&
				(prev = lhs.children[1]) && (
					// Logical precedence
					(
						token.val == '&&' &&
						prev.val == '||'
					) || (
						token.type == _t.op_cmp &&
						token.val != '&&' &&
						token.val != '||'
					) || (
						prev.type == _t.op_cmp &&
						token.type == _t.op_arm
					) || (
					// Arithmetic precedence
						(token.val == '*' || token.val == '/') &&
						(prev.val == '+' || prev.val == '-')
					) ||
					// Bitwise precedence
					token.val == 'and' && (prev.val == 'xor' || prev.val == 'or') ||
					token.val == 'xor' && prev.val == 'or'
				)
			)
		) {
			// Current binary is more important than last expression.
			// Steal rhs of the last expression and use it as lhs in this binary.
			this.current = lhs;
			this.parse_binary(lhs.last);
			this.up();
			return;
		} else {
			// See if the - operator should be parsed as a unary instead.
			if( token.val == '-' && (
					!lhs ||
					lhs.name == OPERATOR ||
					// to parse things like 1,-1 and 1,2--1 correctly
					lhs.parent.name == LIST && this.tokens.back().val == ',' ||
					lhs.parent.name == PIPE
				)
			) {
				this.parse_unary();
				return;
			} else if( lhs ) {
				this.wrap(BINARY);
				op = this.addup(OPERATOR);
				op.val = token.val;
				op.type = token.type;
				
				this.tokens.skip(true);
				this.parse();
				this.up();
				return;
			}
		}
		
		var cur = this.tokens.current();
		_error(_e.UNEXPECTED_TOKEN, cur.val, cur.index);
	};
	// 
	Parser.prototype.parse_collection = function() {
		var token;
		
		this.add(COLLECT);
		while(
			(token = this.tokens.peek(true)) &&
			token.val != ']'
		) {
			this.tokens.skip(true);
			this.parse();
		}
		
		if( !token )
			_error(_e.EOF);
		this.tokens.next();
		this.up();
		
		// Check if this collection has a filter attached.
		this.parse_filter(true);
	};
	// Parses an object filter
	// wrap==true when the filter is attached to another expression instead
	// of being a filter on its own. In this case this filter should wrap the
	// last expression and use it as its input.
	Parser.prototype.parse_filter = function( wrap ) {
		var all = true
			, last, peek, token;
		
		if( wrap ) {
			if( (peek = this.tokens.peek(true)) && 
					(peek.val == '.' || peek.val == '[')
			) {
				// This is a filter on an expression, so wrap that expression as this
				// filter's target.
				this.wrap(FILTER);
				this.wrap(TARGET);
				this.up();
			} else {
				return false;
			}
		} else {
			this.add(FILTER);
			this.addup(TARGET).val = '.';
		}
		
		while( peek = this.tokens.peek() ) {
			if( peek.val == '[' ) {
				all = true;
				this.tokens.next();
				while( (peek = this.tokens.peek(true)) && peek.val != ']' ) {
					this.tokens.skip(true);
					this.parse();
					all = false;
				}
				
				if( all ) {
					this.addup(KEY_ALL);
					all = false;
				}
				
				if( !(token = this.tokens.skip(true)) || token.val != ']' )
					_error(token ? _e.UNEXPECTED_TOKEN : _e.EOF, token && token.val, token && token.index);
			} else if(
				(this.current.last.name == TARGET && peek.val != '.' || peek.val == '.' && this.tokens.next()) &&
				(peek = this.tokens.peek()) && (
					peek.type == _t.id ||
					peek.type == _t.itg
				)
			) {
				// Shorthand form
				token = this.tokens.next();
				if( token.type == _t.id ) {
					this.addup(STRING).val = token.val;
				} else {
					this.addup(NUMBER).val = parseFloat(token.val);
				}
			} else {
				break;
			}
		}
		
		if( all ) {
			this.up();
		} else {
			if( !this.tokens.current() )
				_error(_e.EOF);
			this.up();
		}
	};
	// Parse a function call
	Parser.prototype.parse_function = function() {
		var peek, token;
		
		this.add(FUNCTION_CALL).val = this.tokens.current().val;
		
		if( (peek = this.tokens.peek(true)) && peek.val == '(' ) {
			this.tokens.skip(true);
			
			if( (peek = this.tokens.peek(true)) && peek.val != ')' ) {
				this.add(ARGUMENT);
				while( (token = this.tokens.skip(true)) && token.val != ')' ) {
					this.parse();
				}
				this.up();
				
				if( !(token = this.tokens.current()) || token.val != ')' )
					_error(token ? _e.UNEXPECTED_TOKEN : _e.EOF, token && token.val, token && token.index);
			} else {
				this.tokens.skip(true);
			}
		}
		
		this.up();
		
		// Check if this function call has a filter attached.
		this.parse_filter(true);
	};
	// Creates a comma separated list of expressions. These lists cannot
	// be nested. Lists can be nested inside parenthesis and square/curly brackets.
	Parser.prototype.parse_list = function() {
		var len = this.current.children.length,
				cur = this.current,
				peek;
		
		if( len && (cur = this.current.children[len-1]).name == LIST ) {
			// Last child was already a list? Add this to that branch
			this.current = cur;
		} else if( len ) {
			// Otherwise wrap last child and the new value into a new list branch
			this.wrap(LIST);
		} else {
			_error(_e.UNEXPECTED_TOKEN, ',', this.tokens.current().index);
		}
		
		// TODO: When )]}| is encountered, throw?
		while(
			(peek = this.tokens.peek(true)) && (
				peek.type != _t.ctl ||
				peek.val != ',' &&
				peek.val != ')' &&
				peek.val != ']' &&
				peek.val != '}' &&
				peek.val != '|'
			)
		) {
			this.tokens.skip(true);
			this.parse();
		}
		this.up();
	};
	// Parse string and numbers
	// TODO: booleans?
	Parser.prototype.parse_literal = function() {
		var token = this.tokens.current();
		if( token.type == _t.str ) {
			this.addup(STRING).val = token.val;
		} else {
			this.addup(NUMBER).val = parseFloat(token.val);
		}
	};
	// Parse object definitions
	Parser.prototype.parse_object = function() {
		var error = false,
			token, peek, key, value;
		
		this.add(OBJECT);
		while( (token = this.tokens.skip(true)) && token.val != '}' ) {
			key_switch:
			switch( token.type ) {
				// A key can only be a specific group of tokens
				case _t.ctl:
				case _t.vrb:
				case _t.id:
				case _t.itg:
				case _t.str:
					if( token.type == _t.ctl && token.val == ',' ) {
						// Comma found. Look for another element, or throw when there is none
						// or this is a double comma.
						if( !this.current.children.length ) {
							_error(_e.UNEXPECTED_TOKEN, ',', token.index);
						} else if(
							(peek = this.tokens.peek(true)) &&
							peek.type == _t.ctl && (peek.val == ',' || peek.val == '}')
						) {
							_error(_e.UNEXPECTED_TOKEN, peek.val, peek.index);
						} else if( !peek ) {
							_error(_e.EOF);
						} else {
							continue;
						}
					} else if( token.type != _t.ctl || token.val == '.' || token.val == '(' ) {
						// Element is found. The key can be a literal, a filter, or a complex
						// expression in parenthesis that returns one result
						this.add(ELEMENT);
						switch( token.type ) {
							case _t.itg:
							case _t.str:
							case _t.id:
								this.addup(KEY).val = token.val;
								break;
							default:
								this.add(KEY);
								this.parse();
								this.up();
						}
						
						if( (peek = this.tokens.peek(true)) && peek.val == ':' ) {
							// First skip the colon
							this.tokens.skip(true);
							token = this.tokens.skip(true);
							switch( token.type ) {
								case _t.op_uny:
								case _t.op_arm:
								case _t.itg:
								case _t.str:
								case _t.id:
								case _t.ctl:
								case _t.bln:
								case _t.nil:
								case _t.udf:
								case _t.vrb:
									this.add(VALUE);
									if(
										// When token is arithmetic, only '-'' is allowed (as a unary)
										token.type == _t.op_arm && token.val != '-' ||
										// Throw when another ',' or ':' token is found
										token.type != _t.ctl ||
										token.val == '.' || token.val == '[' || token.val == '(' || token.val == '{'
									) {
										this.parse();
									} else {
										_error(_e.UNEXPECTED_TOKEN, token.val, token.index);
									}
									// Also up out of ELEMENT
									this.up(2);
									break key_switch;
							}
						} else if( token.type != _t.ctl && peek && (peek.val == ',' || peek.val == '}') ) {
							// Shortcut filter
							this.add(VALUE);
							this.add(FILTER);
							this.addup(TARGET).val = '.';
							this.addup(STRING).val = token.val;
							// Also up out of ELEMENT
							this.up(3);
							break;
						}
					}
				default:
					_error(_e.UNEXPECTED_TOKEN, (peek?peek:token).val, (peek?peek:token).index);
			}
		}
		this.up();
	};
	Parser.prototype.parse_parens = function() {
		var token;
		this.add(PARENS);
		while( (token = this.tokens.skip(true)) && token.val != ')' )
			this.parse();
		this.up();
		// Check if these parentheses has a filter attached.
		this.parse_filter(true);
	};
	// 
	Parser.prototype.parse_pipe = function() {
		this.wrap(PIPE);
		this.tokens.skip(true);
		this.parse();
		this.up();
	};
	Parser.prototype.parse_unary = function() {
		var token = this.tokens.current();
		if( !this.tokens.skip(true) )
			_error(_e.EOF);
		this.add(UNARY).val = token.val;
		this.parse();
		this.up();
	};
	Parser.prototype.parse_variable = function() {
		var current = this.add(VARIABLE),
				peek;
		current.val = this.tokens.current().val;
		
		this.up();
		// Check if this variable has a filter attached.
		this.parse_filter(true);
	};
	Parser.prototype.toJSON = function( branch ) {
		var ret = {}, key;
		branch = branch || this.tree;
		
		for( key in branch ) {
			switch( key ) {
				case 'parent':
				case 'last':
					branch[key] && (ret[key] = branch[key].id);
					break;
				case 'children':
					ret[key] = [];
					for( var i=0; i<branch[key].length; i++ ) {
						ret[key].push(this.toJSON(branch[key][i]));
					}
					break;
				default:
					ret[key] = branch[key];
			}
		}
		
		return ret;
	};
	Parser.prototype.up = function( num ) {
		if( this.current.parent ) {
			if( --num > 0 )
				this.up(num);
			return this.current = this.current.parent;
		} else {
			_error('jsq_up: Fatal internal error. Bug?');
		}
	};
	// Say you have:
	//    program > filter
	// Now when you do wrap(LIST):
	//    program > list > filter
	Parser.prototype.wrap = function( name ) {
		var last, parent, ret;
		
		last = this.current.children.pop();
		last.parent.last = last.parent.children[last.parent.children.length-1] || null;
		
		ret = this.add(name);
		this.add(last);
		this.up();
		
		return ret;
	};
	
	
	// Runtime
	function _assignment( input, output, children ) {
		if( children.length == 2 ) {
			// Value assignment to variable
			_vars[children[1].val] = _expression(input, [], children[0]);
			if( input instanceof Array )
				output.push.apply(output, input);
			else
				output.push(input);
		} else if( children.length == 3 ) {
			// Value assignment to filter.
			var op = children[1].val,
					inputCopy = _copy(input),
					exp, res;
			
			if( op == '=' ) {
				// Simple assignment. Take the result from the rhs expression, and assign
				// it to elements resulting from the lhs filter. Is the rhs expression produces
				// multiple results, use the last.
				exp = _expression(input, [], children[2]).pop();
				res = exp !== void(0) ? exp : null;
				_filter(inputCopy, inputCopy, null, children[0].children, function( val, key, obj ) {
					obj[key] = res;
				});
			} else if( op == '|=' ) {
				// 'Update' assignment. Use the lhs filter as input to evaluate the rhs expression, and
				// assign the result to the elements resulting from the lhs filter.
				_filter(inputCopy, inputCopy, null, children[0].children, function( val, key, obj ) {
					exp = _expression([obj[key]], [], children[2]).pop();
					res = exp !== void(0) ? exp : null;
					obj[key] = res;
				});
			}
			
			output.push.apply(output, inputCopy);
		}
	}
	function _binary( input, output, branch, undefined ) {
		var op = branch.children[1].val,
			lhv = branch.children[0],
			rhv = branch.children[2];
		var l = lhv.name == NUMBER ?
			[lhv.val] :
			_expression(input, [], lhv);
		var r = rhv.name == NUMBER ?
			[rhv.val] :
			_expression(input, [], rhv);
		var i, j, ret, key;
		
		if( !l.length ) l = [undefined];
		if( !r.length ) r = [undefined];
		
		for( i=0; i<l.length; i++ ) {
			for( j=0; j<r.length; j++ ) {
				switch( op ) {
					case '==':
					case '!=':
						// Perform a custom equality comparison only
						// when both sides are non-scalar.
						if( !_scalar(l[i]) && !_scalar(r[j]) )
							ret = _binary.comp[op](_compare(l[i], r[j]));
						else
							ret = _binary.op[op](l[i], r[j]);
						break;
					case '>=':
					case '<=':
					case '>':
					case '<':
						// When comparing non-scalar values, perform a custom comparison.
						var lscalar = _scalar(l[i])
							, rscalar = _scalar(r[j]);
						if( !lscalar || !rscalar || lscalar == 'boolean' || rscalar == 'boolean' ) {
							ret = _binary.comp[op](_compare(l[i], r[j]));
							break;
						}
					case '===':
					case '+':
					case '-':
					case '*':
					case '/':
					case 'and':
					case 'or':
					case 'xor':
					case '&&':
					case '||':
						ret = _binary.op[op](l[i], r[j]);
						break;
				}
				ret != undefined && output.push(ret);
				ret = undefined;
			}
		}
	}
	// For comparing non-scalar values. Expects that
	// parameter `val` is the result of a `_compare` call.
	_binary.comp = {
		'==': function( val ) { return val==0 },
		'!=': function( val ) { return val!=0 },
		'>=': function( val ) { return val>=0 },
		'<=': function( val ) { return val<=0 },
		'>':  function( val ) { return val>0 },
		'<':  function( val ) { return val<0 }
	};
	_binary.op = {
		'+':  function( l, r ) {
			if( !(l instanceof Object || r instanceof Object) )
				return l + r;
			else if( l instanceof Array || r instanceof Array )
				return _concat(l, r);
			else if( l instanceof Object && r instanceof Object )
				return _extend({}, l, r);
		},
		'-':  function( l, r ) {
			if( l instanceof Object || r instanceof Object )
				return _without(l, r);
			else
				return l - r;
		},
		'*':   function( l, r ) { return l * r },
		'/':   function( l, r ) { return l / r },
		'&&':  function( l, r ) { return l && r },
		'||':  function( l, r ) { return l || r },
		'==':  function( l, r ) { return l == r },
		'===': function( l, r ) { return l === r },
		'!=':  function( l, r ) { return l != r },
		'>=':  function( l, r ) { return l >= r },
		'<=':  function( l, r ) { return l <= r },
		'>':   function( l, r ) { return l > r },
		'<':   function( l, r ) { return l < r },
		'and': function( l, r ) { return l & r },
		'or':  function( l, r ) { return l | r },
		'xor': function( l, r ) { return l ^ r }
	};
	function _expression( input, output, branch ) {
		var col, i, result, len;
		
		switch( branch.name ) {
			case ASSIGNMENT:
				_assignment(input, output, branch.children);
				break;
			case BINARY:
				_binary(input, output, branch);
				break;
			case BOOL:
				output.push(branch.val=='true'?true:false);
				break;
			case COLLECT:
				col = [];
				branch.children.length && _expression(input, col, branch.children[0]);
				output.push(col);
				break;
			case LIST:
				for( i=0; i<branch.children.length; i++ )
					_expression(input, output, branch.children[i]);
				break;
			case FILTER:
				_filter(input, input, output, branch.children);
				break;
			case FUNCTION_CALL:
				_function(input, output, branch);
				break;
			case NIL:
				output.push(null);
				break;
			case NUMBER:
			case STRING:
				output.push(branch.val);
				break;
			case OBJECT:
				_object(input, output, branch.children);
				break;
			case PARENS:
				result = _expression(input, [], branch.children[0]);
				output.push.apply(output, result);
				break;
			case PIPE:
				input = _expression(input, output, branch.children[0]);
				len = input.length;
				input = input.splice(0,len);
				// Run rhs of the pipe, even if lhs produces no results.
				for( i=0; i<len || i+len==0; i++ )
					_expression(len>0 ? [input[i]] : [], output, branch.children[1]);
				break;
			case UNARY:
				_unary(input, output, branch);
				break;
			case UNDEFINED:
				output.push(void(0));
				break;
			case VARIABLE:
				_variable(input, output, branch);
				break;
		}
		return output;
	}
	// Interpret a filter.
	// callback = function( value, key, object ) and is called when the end of a
	// filter is reached. Caution! This function is called regardless if the value is
	// actually found. The callback should check for that.
	// 
	// `all` is always the full input; `input` is a subset upon recursion.
	function _filter( all, input, output, filter, callback ) {
		var target, child, i, j, element, key, sub;
		
		// No callback? Then perform default action: returning found value as result.
		if( !callback ) {
			callback = function( val, key, obj ) {
				val !== void(0) && output.push(val);
			};
		}
		
		filter = filter.slice(0);
		
		// Root call
		if( all === input ) {
			target = filter.shift();
			if( !target.val && target.children.length ) {
				input = _expression(input, [], target.children[0]);
			}
		}
		
		child = filter.shift();
		for( j=0; j<input.length; j++ ) {
			element = input[j];
			// When querying for sub-sub-keys, the result can be undefined at the first sub-key.
			if( element === void(0) ) continue;
			
			// TODO: `range` as key selector for arrays
			if( !child ) {
				callback(element);
			} else if( child.name == KEY_ALL ) {
				// All elements
				_each(element, !filter.length ? callback : function( val ) {
					_filter(all, [val], output, filter, callback);
				});
			} else if(
				element instanceof Array && child.name == NUMBER ||
				!(element instanceof Array ) && element instanceof Object && (
					child.name == NUMBER ||
					child.name == STRING
				)
			) {
				// Single element
				if( !filter.length )
					callback(element[child.val], child.val, element);
				else
					_filter(all, [element[child.val]], output, filter, callback);
			} else {
				// Every other case: sub-expression
				sub = _expression(all, [], child);
				for( i=0; i<sub.length; i++ ) {
					if( !filter.length )
						callback(element[sub[i]], sub[i], element);
					else
						_filter(all, [element[sub[i]]], output, filter, callback);
				}
			}
		}
	}
	function _function( input, output, branch ) {
		if( branch.val && typeof jsq['fn'][branch.val] == 'function' ) {
			jsq['fn'][branch.val](input[0], output, branch.children[0] && branch.children[0].children[0]);
		}
	}
	// Creating an object is a complex one. When defining an object in JSQ, multiple actual objects
	// can be returned. This happens in two cases:
	// 1) There are multiple inputs. An object is created for every input found.
	// 2) At least one element has a filter as value that produces multiple outputs.
	// 		An object is created for every output. If multiple element value filters produce
	// 		multiple outputs, a cartesian product between all these outputs is created.
	function _object( input, output, elements, result ) {
		var i, el, key, exp;
		
		// Create an object for every input found. If input is empty, run at least once.
		if( result === void(0) ) {
			for( i=0; i<input.length || input.length == 0 && !i; i++ ) {
				_object([input[i]], output, elements, null);
			}
			return;
		}
		
		elements = elements.slice(0);
		result = _extend({}, result);
		
		if( el = elements.shift() ) {
			el = el.children;
			// Key
			if( el[0].children.length ) {
				exp = _expression(input, [], el[0].children[0]);
				if( exp.length == 1 )
					key = exp[0];
				else
					_error('Key definition with multiple or no values');
			} else {
				key = el[0].val;
			}
			
			// Value
			// If the expression returns multiple results, output that many objects.
			// If multiple values return multiple results, perform a cross join.
			exp = _expression(input, [], el[1].children[0]);
			if( !exp.length )
				return _object(input, output, elements, result);
			for( i=0; i<exp.length; i++ ) {
				result[key] = exp[i];
				_object(input, output, elements, result);
			}
		} else {
			output.push(result);
		}
	}
	function _variable( input, output, branch ) {
		output.push.apply(output, _vars[branch.val]);
	}
	function _unary( input, output, branch ) {
		var op = branch.val,
				exp = _expression(input, [], branch.children[0]),
				i;
		for( i=0; i<exp.length; i++ ) {
			if( op === '!' )
				output.push(!exp[i]);
			else if( op === '-' )
				output.push(-exp[i]);
			else if( op === '~' )
				output.push(~exp[i]);
		}
	}
	
	// Store an expression's variable data in this hash. Can be a shared object
	// since jsq() calls can never be parallel.
	var _vars = {};
	
	// Public jsq() function
	// callback = function(value, index, outputArray)
	var jsq = function( /*data..., query, callback, ctx*/ ) {
		// Determine arguments
		var input = []
			, args = Array.prototype.slice.call(arguments, 0)
			, output = []
			, arg, node, i, parser
			, query, callback, ctx;
		
		// All arguments preceding the query are input values
		while( (arg = args.shift()) && typeof arg != 'string' )
			input.push(arg);
		if( typeof arg != 'string' ) return [];
		query = arg;
		if( callback = args.shift() )
			ctx = args.shift() || this;
		
		// Perform query
		parser = new Parser(query);
		parser.parse();
		if( node = parser.tree.children[0] ) {
			if( input.length ) {
				_each(input, function( input ) {
					_expression([input], output, node);
				});
			} else {
				_expression(input, output, node);
			}
			
			// Reset _vars for this query
			_vars = {};
			if( typeof callback == 'function' ) {
				// If a callback is provided, iterate through results, breaking when return===false.
				_each(output, function() {
					return callback.apply(ctx, arguments);
				});
			}
			return output;
		} else {
			return [];
		}
	};
	if( DEV ) {
		jsq['Lexer'] = Lexer;
		jsq['Parser'] = Parser;
	}
	
	// Standard functions
	jsq['fn'] = {
		'add': function( input, output ) {
			var ret, undefined;
			_each(input, function( val ) {
				ret = ret==undefined ? val : _binary.op['+'](ret, val);
			});
			
			return output.push(ret);
		},
		'if': function( input, output, argument ) {
			if( argument && argument.name == LIST && argument.children.length >= 2 ) {
				var children = argument.children
					, input = [input] // <-- ATTENTION
					, exp = _expression(input, [], children[0])
					, i;
				for( i=0; i<exp.length; i++ ) {
					if( exp[i] ) return _expression(input, output, children[1]);
				}
				if( children[2] )
					_expression(input, output, children[2]);
			} else {
				_error('if: Incorrect syntax on if() call');
			}
		},
		'empty': function() {
			return;
		},
		'format': function( input, output, argument ) {
			if( !(input instanceof Array) || !argument || argument.name != STRING )
				return;
			
			input = input.slice(0);
			input.unshift(argument.val);
			output.push(_sprintf.apply(this, input));
		},
		'keys': function( input, output ) {
			_each(input, function( val, key ) {
				output.push(key);
			});
		},
		'length': function( input, output ) {
			if( input instanceof Array || typeof input == 'string' ) {
				output.push(input.length);
			} else if( input instanceof Object ) {
				var count = 0;
				for( var key in input )
					count++;
				output.push(count);
			} else if( input === null ) {
				output.push(0);
			}
		},
		'map': function( input, output, argument ) {
			if( input instanceof Object ) {
				_each(input, function( input ) {
					output.push.apply(output, _expression([input], [], argument));
				});
			}
		},
		'max': function( input, output, argument ) {
			output.push(_extreme('max', input, argument));
		},
		'min': function( input, output, argument ) {
			output.push(_extreme('min', input, argument));
		},
		'not': function( input, output ) {
			output.push(!input);
		},
		'pairs': function( input, output ) {
			_each(input, function( val, key ) {
				output.push([key, val]);
			});
		},
		'recurse': function( input, output, argument, level ) {
			if( argument && argument.name == FILTER ) {
				if( !level ) {
					input = [input];
					level = 0;
				}
				level++;
				
				for( var i=0; i<input.length; i++ ) {
					output.push(input[i]);
					var exp = _expression([input[i]], [], argument);
					if( exp.length )
						this['recurse'](exp, output, argument, level);
				}
			}
		},
		'select': function( input, output, argument ) {
			var result = _each( _expression([input], [], argument), function( exp ) {
				if( exp ) return false;
			});
			if( !result )
				output.push(input);
		},
		'sort': function( input, output, argument ) {
			if( !(input instanceof Array) )
				_error('sort: Can only sort arrays');
			
			output.push(input.sort(_compare));
		},
		'tonumber': function( input, output, argument, undefined ) {
			if( argument )
				input = _expression([input], [], argument);
			else
				input = [input];
			
			for( var i=0; i<input.length; i++ ) {
				if( input[i] instanceof Object )
					output.push(null);
				else if( typeof input[i] == 'boolean' )
					output.push(~~input[i]);
				else
					output.push(parseFloat(input[i]) || null);
			}
		},
		'tostring': function( input, output, argument, undefined ) {
			if( !argument ) {
				input != undefined && output.push(JSON.stringify(input));
			} else {
				var exp = _expression([input], [], argument);
				for( var i=0; i<exp.length; i++ ) {
					exp[i] != undefined && output.push(JSON.stringify(exp[i]));
				}
			}
		},
		'unique': function( input, output ) {
			var i = -1
				, len = input.length
				, result = [];
			
			while( ++i < len ) {
				var value = input[i];
				if( _indexOf(result, value) < 0 )
					result.push(value);
			}
			output.push(result);
		}
	};
	
	
	// Expose jsq
	// ----------
	// Based on Lo-Dash's implementation.
	// 
	// Detect free variable `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `global` and use it as `window`.
	var freeGlobal = typeof global == 'object' && global;
	if( freeGlobal['global'] === freeGlobal ) {
	  window = freeGlobal;
	}
	
	// some AMD build optimizers, like r.js, check for specific condition patterns like the following:
	if( typeof define == 'function' && typeof define['amd'] == 'object' && define['amd'] ) {
	  // Expose jsq to the global object even when an AMD loader is present in
	  // case jsq was injected by a third-party script and not intended to be
	  // loaded as a module.
	  window['jsq'] = jsq;

	  // Define as an anonymous module so, through path mapping, it can be
	  // referenced as the 'jsq' function.
	  define(function() {
	    return jsq;
	  });
	} else if( freeExports ) {
		// Check for `exports` after `define` in case a build optimizer adds an `exports` object.
	  if( typeof module == 'object' && module && module['exports'] == freeExports ) {
	  	// In Node.js or RingoJS v0.8.0+.
	    (module['exports'] = jsq)['jsq'] = jsq;
	  } else {
	  	// In Narwhal or RingoJS v0.7.0-.
	    freeExports['jsq'] = jsq;
	  }
	} else {
	  // In a browser or Rhino.
	  window['jsq'] = jsq;
	}
})(this);