

;(function( window ) {
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
	function _concat( array1, array2 ) {
		if( !(array1 instanceof Array) )
			array1 = [array1];
		if( !(array2 instanceof Array) )
			array2 = [array2];
		return array1.concat(array2);
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
	// Replaces %# in a string with the (#+1)th argument.
	function _sprintf( str /* ,replacement... */ ) {
		var args = Array.prototype.slice.call(arguments, 1);
		return typeof str == 'string' && str.replace(/%(\d+)/g, function(match, i) { 
			return args[i] || '';
		});
	};
	
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
			i = 0; while( ++i<=14 && token[i]==void(0) ){}
			if( i == _t.str )
				token[0] = token[0].slice(1,-1);
			// Add token.
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
	Lexer.tokenTypes = _t;
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
		this.tree = this.add('program');
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
					this.addup('bool').value = token.data;
					break;
				case _t.nil:
					this.addup('null');
					break;
				case _t.udf:
					this.addup('undefined');
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
					switch( token.data ) {
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
							_error(_e.UNRECOGNIZED_TOKEN, token.data, token.index);
					}
			}
			// If this is a subroutine of parse(), break out when
			// we're back in the branch where it was called
			if( this.current.id && this.current.id == branchId )
				return;
			
			this.tokens.next();
		}
		
		if( this.tokens.eof() && this.current.name != 'program' )
			_error(_e.EOF);
		
		return this;
	};
	Parser.prototype.parse_assignment = function( opToken ) {
		var token = this.tokens.skip(true),
				num = 1;
		
		// If assignment follows a pipe, take the end of the pipe
		// as the value for the assignment. Otherwise the entire pipe
		// would be taken as input, producing unexpected results.
		if( this.current.last.name == 'pipe' ) {
			this.current = this.current.last;
			num = 2;
		}
		
		this.wrap('assignment');
		switch( opToken.data ) {
			case 'as':
				if( token && token.type == _t.vrb )
					this.addup('name').value = token.data;
				break;
			case '=':
			case '|=':
			case '+=':
			case '-=':
			case '*=':
			case '/=':
				if( this.current.last.name != 'filter' )
					_error(_e.UNEXPECTED_TOKEN, opToken.data, opToken.index);
				if( opToken.data != '=' && opToken.data != '|=' ) {
					// Shorthand op for x |= . op filter
					this.addup('operator').value = '|='
					this.add('binary');
					this.addup('filter');
					this.addup('operator').value = opToken.data.substr(0,1);
					this.parse();
					this.up();
				} else {
					// = or |=
					this.addup('operator').value = opToken.data;
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
				lhs.name == 'pipe' ||
				// Value assignment, eg.: .foo=1 or .foo|=.[0]
				lhs.name == 'assignment' && lhs.children.length == 3 ||
				token.type == _t.op_arm && lhs.name == 'list' ||
				// The left hand side is a binary, so it has 3 children:
				// a lhs, an operator and a rhs. Perform an action based on
				// its operator.
				lhs.name == 'binary' &&
				(prev = lhs.children[1]) && (
					// Logical precedence
					(
						token.data == '&&' &&
						prev.value == '||'
					) || (
						token.type == _t.op_cmp &&
						token.data != '&&' &&
						token.data != '||'
					) || (
						prev.type == _t.op_cmp &&
						token.type == _t.op_arm
					) || (
					// Arithmetic precedence
						(token.data == '*' || token.data == '/') &&
						(prev.value == '+' || prev.value == '-')
					) ||
					// Bitwise precedence
					token.data == 'and' && (prev.value == 'xor' || prev.value == 'or') ||
					token.data == 'xor' && prev.value == 'or'
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
			if( token.data == '-' && (
					!lhs ||
					lhs.name == 'operator' ||
					// to parse things like 1,-1 and 1,2--1 correctly
					lhs.parent.name == 'list' && this.tokens.back().data == ',' ||
					lhs.parent.name == 'pipe'
				)
			) {
				this.parse_unary();
				return;
			} else if( lhs ) {
				this.wrap('binary');
				op = this.addup('operator');
				op.value = token.data;
				op.type = token.type;
				
				this.tokens.skip(true);
				this.parse();
				this.up();
				return;
			}
		}
		
		var cur = this.tokens.current();
		_error(_e.UNEXPECTED_TOKEN, cur.data, cur.index);
	};
	// 
	Parser.prototype.parse_collection = function() {
		var token;
		
		this.add('collect');
		while(
			(token = this.tokens.peek(true)) &&
			token.data != ']'
		) {
			this.tokens.skip(true);
			this.parse();
		}
		
		if( !token )
			_error(_e.EOF);
		this.tokens.next();
		this.up();
	};
	// Creates a comma separated list of expressions. These lists cannot
	// be nested. Lists can be nested inside parenthesis and square/curly brackets.
	Parser.prototype.parse_list = function() {
		var len = this.current.children.length,
				cur = this.current,
				peek;
		
		if( len && (cur = this.current.children[len-1]).name == 'list' ) {
			// Last child was already a list? Add this to that branch
			this.current = cur;
		} else if( len ) {
			// Otherwise wrap last child and the new value into a new list branch
			this.wrap('list');
		} else {
			_error(_e.UNEXPECTED_TOKEN, ',', this.tokens.current().index);
		}
		
		// TODO: When )]}| is encountered, throw?
		while(
			(peek = this.tokens.peek(true)) && (
				peek.type != _t.ctl ||
				peek.data != ',' &&
				peek.data != ')' &&
				peek.data != ']' &&
				peek.data != '}' &&
				peek.data != '|'
			)
		) {
			this.tokens.skip(true);
			this.parse();
		}
		this.up();
	};
	// Parses an object filter
	Parser.prototype.parse_filter = function() {
		var all = true,
			peek, token;
		
		// TODO:
		// Two filters next to eachother without comma, pipe etc. should throw.
		this.add('filter');
		
		while( peek = this.tokens.peek() ) {
			if( peek.data == '[' ) {
				all = true;
				this.tokens.next();
				while( (peek = this.tokens.peek(true)) && peek.data != ']' ) {
					this.tokens.skip(true);
					this.parse();
					all = false;
				}
				
				if( all ) {
					this.addup('key_all');
					all = false;
				}
				
				if( !(token = this.tokens.skip(true)) || token.data != ']' )
					_error(token ? _e.UNEXPECTED_TOKEN : _e.EOF, token && token.data, token && token.index);
			} else if(
				(!this.current.children.length && peek.data != '.' || peek.data == '.' && this.tokens.next()) &&
				(peek = this.tokens.peek()) && (
					peek.type == _t.id ||
					peek.type == _t.itg
				)
			) {
				// Shorthand form
				token = this.tokens.next();
				if( token.type == _t.id ) {
					this.addup('string').value = token.data;
				} else {
					this.addup('number').value = parseFloat(token.data);
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
		
		this.add('function_call').value = this.tokens.current().data;
		
		if( (peek = this.tokens.peek(true)) && peek.data == '(' ) {
			this.tokens.skip(true);
			
			if( (peek = this.tokens.peek(true)) && peek.data != ')' ) {
				this.add('argument');
				while( (token = this.tokens.skip(true)) && token.data != ')' ) {
					this.parse();
				}
				this.up();
				
				if( !(token = this.tokens.current()) || token.data != ')' )
					_error(token ? _e.UNEXPECTED_TOKEN : _e.EOF, token && token.data, token && token.index);
			} else {
				this.tokens.skip(true);
			}
		}
		
		this.up();
	};
	// Parse string and numbers
	// TODO: booleans?
	Parser.prototype.parse_literal = function() {
		var token = this.tokens.current();
		if( token.type == _t.str ) {
			this.addup('string').value = token.data;
		} else {
			this.addup('number').value = parseFloat(token.data);
		}
	};
	// Parse object definitions
	Parser.prototype.parse_object = function() {
		var error = false,
			token, peek, key, value;
		
		this.add('object');
		while( (token = this.tokens.skip(true)) && token.data != '}' ) {
			key_switch:
			switch( token.type ) {
				// A key can only be a specific group of tokens
				case _t.ctl:
				case _t.vrb:
				case _t.id:
				case _t.itg:
				case _t.str:
					if( token.type == _t.ctl && token.data == ',' ) {
						// Comma found. Look for another element, or throw when there is none
						// or this is a double comma.
						if( !this.current.children.length ) {
							_error(_e.UNEXPECTED_TOKEN, ',', token.index);
						} else if(
							(peek = this.tokens.peek(true)) &&
							peek.type == _t.ctl && (peek.data == ',' || peek.data == '}')
						) {
							_error(_e.UNEXPECTED_TOKEN, peek.data, peek.index);
						} else if( !peek ) {
							_error(_e.EOF);
						} else {
							continue;
						}
					} else if( token.type != _t.ctl || token.data == '.' || token.data == '(' ) {
						// Element is found. The key can be a literal, a filter, or a complex
						// expression in parenthesis that returns one result
						this.add('element');
						switch( token.type ) {
							case _t.itg:
							case _t.str:
							case _t.id:
								this.addup('key').value = token.data;
								break;
							default:
								this.add('key');
								this.parse();
								this.up();
						}
						
						if( (peek = this.tokens.peek(true)) && peek.data == ':' ) {
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
									this.add('value');
									if(
										// When token is arithmetic, only '-'' is allowed (as a unary)
										token.type == _t.op_arm && token.data != '-' ||
										// Throw when another ',' or ':' token is found
										token.type != _t.ctl ||
										token.data == '.' || token.data == '[' || token.data == '(' || token.data == '{'
									) {
										this.parse();
									} else {
										_error(_e.UNEXPECTED_TOKEN, token.data, token.index);
									}
									// Also up out of 'element'
									this.up(2);
									break key_switch;
							}
						} else if( token.type != _t.ctl && peek && (peek.data == ',' || peek.data == '}') ) {
							// Shortcut filter
							this.add('value');
							this.add('filter');
							this.addup('string').value = token.data;
							// Also up out of 'element'
							this.up(3);
							break;
						}
					}
				default:
					_error(_e.UNEXPECTED_TOKEN, (peek?peek:token).data, (peek?peek:token).index);
			}
		}
		this.up();
	};
	Parser.prototype.parse_parens = function() {
		var token;
		this.add('parens');
		while( (token = this.tokens.skip(true)) && token.data != ')' )
			this.parse();
		this.up();
	};
	// 
	Parser.prototype.parse_pipe = function() {
		this.wrap('pipe');
		this.tokens.skip(true);
		this.parse();
		this.up();
	};
	Parser.prototype.parse_unary = function() {
		var token = this.tokens.current();
		if( !this.tokens.skip(true) )
			_error(_e.EOF);
		this.add('unary').value = token.data;
		this.parse();
		this.up();
	};
	Parser.prototype.parse_variable = function() {
		var current = this.add('variable'),
				peek;
		current.value = this.tokens.current().data;
		
		if( (peek = this.tokens.peek()) && (peek.data == '[' || peek.data == '.') )
			this.parse_filter();
		
		this.up();
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
	// Now when you do wrap('list'):
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
	function _binary( input, output, branch, undefined ) {
		var op = branch.children[1].value,
			lhv = branch.children[0],
			rhv = branch.children[2];
		var l = lhv.name == 'number' ?
			[lhv.value] :
			_expression(input, [], lhv);
		var r = rhv.name == 'number' ?
			[rhv.value] :
			_expression(input, [], rhv);
		var i, j, ret, key;
		
		if( !l.length ) l = [undefined];
		if( !r.length ) r = [undefined];
		
		for( i=0; i<l.length; i++ ) {
			for( j=0; j<r.length; j++ ) {
				switch( op ) {
					// Perform arithmetic operation on values
					case '+':
					case '-':
					case '*':
					case '/':
					case 'and':
					case 'or':
					case 'xor':
					case '&&':
					case '||':
					case '==':
					case '===':
					case '!=':
					case '>=':
					case '<=':
					case '>':
					case '<':
						ret = _binary.op[op](l[i], r[j]);
						break;
				}
				ret != undefined && output.push(ret);
				ret = undefined;
			}
		}
	}
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
		'and':   function( l, r ) { return l & r },
		'or':  function( l, r ) { return l | r },
		'xor':   function( l, r ) { return l ^ r }
	};
	function _expression( input, output, branch ) {
		var col, i, result;
		
		switch( branch.name ) {
			case 'assignment':
				_assignment(input, output, branch.children);
				break;
			case 'binary':
				_binary(input, output, branch);
				break;
			case 'bool':
				output.push(branch.value=='true'?true:false);
				break;
			case 'collect':
				col = [];
				branch.children.length && _expression(input, col, branch.children[0]);
				output.push(col);
				break;
			case 'list':
				for( i=0; i<branch.children.length; i++ )
					_expression(input, output, branch.children[i]);
				break;
			case 'filter':
				_filter(input, input, output, branch.children);
				break;
			case 'function_call':
				_function(input, output, branch);
				break;
			case 'null':
				output.push(null);
				break;
			case 'number':
			case 'string':
				output.push(branch.value);
				break;
			case 'object':
				_object(input, output, branch.children);
				break;
			case 'parens':
				result = _expression(input, [], branch.children[0]);
				output.push.apply(output, result);
				break;
			case 'pipe':
				input = _expression(input, output, branch.children[0]);
				input = input.splice(0,input.length);
				for( i=0; i<input.length; i++ )
					_expression([input[i]], output, branch.children[1]);
				break;
			case 'unary':
				_unary(input, output, branch);
				break;
			case 'undefined':
				output.push(void(0));
				break;
			case 'variable':
				_variable(input, output, branch);
				break;
		}
		return output;
	}
	function _assignment( input, output, children ) {
		if( children.length == 2 ) {
			// Value assignment to variable
			_vars[children[1].value] = _expression(input, [], children[0]);
			if( input instanceof Array )
				output.push.apply(output, input);
			else
				output.push(input);
		} else if( children.length == 3 ) {
			// Value assignment to filter.
			var op = children[1].value,
					inputCopy = _copy(input),
					exp;
			
			if( op == '=' ) {
				// Simple assignment. Take the result from the rhs expression, and assign
				// it to elements resulting from the lhs filter. Is the rhs expression produces
				// multiple results, use the last.
				exp = _expression(input, [], children[2]).pop() || null;
				_filter(inputCopy, inputCopy, null, children[0].children, function( val, key, obj ) {
					obj[key] = exp;
				});
			} else if( op == '|=' ) {
				// 'Update' assignment. Use the lhs filter as input to evaluate the rhs expression, and
				// assign the result to the elements resulting from the lhs filter.
				_filter(inputCopy, inputCopy, null, children[0].children, function( val, key, obj ) {
					exp = _expression([obj[key]], [], children[2]).pop() || null;
					obj[key] = exp;
				});
			}
			
			output.push.apply(output, inputCopy);
		}
	}
	// Interpret a filter.
	// callback = function( value, key, object ) and is called when the end of a
	// filter is reached. Caution! This function is called regardless if the value is
	// actually found. The callback should check for that.
	// 
	// `all` is always the full input; `input` is a subset upon recursion.
	function _filter( all, input, output, filter, callback ) {
		var child, i, j, element, key, sub;
		
		// No callback? Then perform default action: returning found value as result.
		if( !callback ) {
			callback = function( val, key, obj ) {
				val != void(0) && output.push(val);
			};
		}
		
		filter = filter.slice(0);
		child = filter.shift();
		for( j=0; j<input.length; j++ ) {
			element = input[j];
			// When querying for sub-sub-keys, the result can be undefined at the first sub-key.
			if( element == void(0) ) continue;
			
			// TODO: `range` as key selector for arrays
			if( !child ) {
				callback(element);
			} else if( child.name == 'key_all' ) {
				// All elements
				_each(element, !filter.length ? callback : function( val ) {
					_filter(all, [val], output, filter, callback);
				});
			} else if(
				element instanceof Array && child.name == 'number' ||
				!(element instanceof Array ) && element instanceof Object && (
					child.name == 'number' ||
					child.name == 'string'
				)
			) {
				// Single element
				if( !filter.length )
					callback(element[child.value], child.value, element);
				else
					_filter(all, [element[child.value]], output, filter, callback);
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
		if( branch.value && typeof jsq['fn'][branch.value] == 'function' ) {
			jsq['fn'][branch.value](input[0], output, branch.children[0] && branch.children[0].children[0]);
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
				key = el[0].value;
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
		var filter;
		if( filter = branch.children[0] ) {
			_filter(input, _vars[branch.value], output, filter.children);
		} else {
			output.push.apply(output, _vars[branch.value]);
		}
	}
	function _unary( input, output, branch ) {
		var op = branch.value,
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
	jsq['Lexer'] = Lexer;
	jsq['Parser'] = Parser;
	
	// Modules
	jsq['fn'] = {
		'add': function( input, output ) {
			var ret, undefined;
			_each(input, function( val ) {
				ret = ret==undefined ? val : _binary.op['+'](ret, val);
			});
			
			return output.push(ret);
		},
		'if': function( input, output, argument ) {
			if( argument && argument.name == 'list' && argument.children.length >= 2 ) {
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
			if( !(input instanceof Array) || !argument || argument.name != 'string' )
				return;
			
			input = input.slice(0);
			input.unshift(argument.value);
			output.push(_sprintf.apply(this, input));
		},
		'keys': function( input, output ) {
			var ret = [];
			_each(input, function( val, key ) {
				ret.push(key);
			});
			if( ret.length )
				output.push(ret);
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
		'pairs': function( input, output ) {
			var ret = [];
			_each(input, function( val, key ) {
				ret.push([key, val]);
			});
			if( ret.length )
				output.push(ret);
		},
		'recurse': function( input, output, argument, level ) {
			if( argument && argument.name == 'filter' ) {
				if( !level ) {
					input = [input];
					level = 0;
				}
				level++;
				
				for( var i=0; i<input.length; i++ ) {
					output.push(input[i]);
					var exp = _expression([input[i]], [], argument);
					if( exp.length )
						this.recurse(exp, output, argument, level);
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
		'tonumber': function( input, output, argument, undefined ) {
			if( !argument ) {
				output.push(~~parseFloat(input));
			} else {
				var exp = _expression([input], [], argument);
				for( var i=0; i<exp.length; i++ ) {
					output.push(~~parseFloat(exp[i]));
				}
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
	if( freeGlobal.global === freeGlobal ) {
	  window = freeGlobal;
	}
	
	// some AMD build optimizers, like r.js, check for specific condition patterns like the following:
	if( typeof define == 'function' && typeof define.amd == 'object' && define.amd ) {
	  // Expose jsq to the global object even when an AMD loader is present in
	  // case jsq was injected by a third-party script and not intended to be
	  // loaded as a module.
	  window.jsq = jsq;

	  // Define as an anonymous module so, through path mapping, it can be
	  // referenced as the 'jsq' function.
	  define(function() {
	    return jsq;
	  });
	} else if( freeExports ) {
		// Check for `exports` after `define` in case a build optimizer adds an `exports` object.
	  if( typeof module == 'object' && module && module.exports == freeExports ) {
	  	// In Node.js or RingoJS v0.8.0+.
	    (module.exports = jsq).jsq = jsq;
	  } else {
	  	// In Narwhal or RingoJS v0.7.0-.
	    freeExports.jsq = jsq;
	  }
	} else {
	  // In a browser or Rhino.
	  window.jsq = jsq;
	}
})(this);