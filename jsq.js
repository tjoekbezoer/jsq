

(function( _exports ) {
	var _regex = new RegExp(
		[
			// (1) unary operator
			'([+]{2}|[-]{2})|',
			// (2) binary operator
			'([-+*/])|',
			// (3) comparison operator
			'((?:&&)|(?:\\|\\|)|(?:==)|(?:!=)|(?:>=)|(?:<=)|<|>)|',
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
	// The elements in _t correlate to the _regexp subpatterns.
	var _t = {
		op_uny: 1,
		op_arm: 2,
		op_cmp: 3,
		ctl: 4,
		vrb: 5,
		id: 6,
		flt: 7,
		itg: 8,
		str: 9,
		wsp: 10
	};
	
	// Extend target object with the properties from the given source objects.
	function _extend( target /*[, source]...*/ ) {
		var args = Array.prototype.slice.call(arguments, 1);
		for( var i=0; i<args.length; i++ ) {
			for( var key in args[i] ) {
				target[key] = args[i][key];
			}
		}
		return target;
	}
	function _concat( array1, array2 ) {
		if( !(array1 instanceof Array) )
			array1 = [array1];
		if( !(array2 instanceof Array) )
			array2 = [array2];
		return array1.concat(array2);
	}
	// When target is an object: return a shallow copy of target from which all keys
	// also existing in source are removed. Both arguments have to be objects.
	// When target is an array: return a copy of target where all values also existing in
	// source are removed. In this case, source can also be a scalar value.
	function _without( target, source ) {
		var key, key_target;
		if( target instanceof Array ) {
			if( !(source instanceof Object) )
				source = [source];
			target = target.slice(0);
			// Exclude values found in the source array
			for( var i=0; i<source.length; i++ ) {
				value = source[i];
				for( var j=0; j<target.length; j++ ) {
					if( target[j] === value )
						target.splice(j, 1);
				}
			}
		} else if( target instanceof Object && source instanceof Object ) {
			target = _extend({}, target);
			// Exclude keys found in the source object
			for( key in source ) {
				for( key_target in target ) {
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
	
	// TODO: Optimize throw mechanism. Group error strings here?
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
			// This line is based on the fact that `token` will always return an array like
			// [matched string, [subpattern, ...]], so in this case 10 elements after the
			// matched string.
			i = 0; while( ++i<=10 && token[i]==void(0) ){}
			if( i == _t.str )
				token[0] = token[0].slice(1,-1);
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
			switch( token.data ) {
				case '.':
					this.parse_filter();
					break;
				case '(':
					this.add('parens');
					this.tokens.next();
					this.parse();
					break;
				case ')':
					if( this.current.name != 'parens' )
						throw 'jsq_parse: Unexpected ) at position '+token.index;
					this.up();
					break;
				case '[':
					this.add('collect');
					this.tokens.next();
					this.parse();
					break;
				case ']':
					if( this.current.name != 'collect' )
						throw 'jsq_parse: Unexpected ] at position '+token.index;
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
						case _t.op_arm:
						case _t.op_cmp:
							this.parse_binary();
							break;
						case _t.id:
							this.parse_id();
							break;
						case _t.flt:
						case _t.itg:
						case _t.str:
							this.parse_filter();
							break;
						case _t.wsp:
							this.tokens.next();
							continue;
						default:
							throw 'jsq_parse: Unrecognized \''+token.data+'\' at position '+token.index;
					}
						
			}
			
			// If this is a subroutine of parse(), break out when
			// we're back in the branch where it was called
			if( this.current.id && this.current.id == branchId )
				return;
			
			this.tokens.next();
		}
		
		if( this.tokens.eof() && this.current.name != 'program' )
			throw 'jsq_parse: Unexpected EOF';
		
		return this;
	};
	// A binary is two expressions combined by an arithmetic- or a comparison operator.
	// Binaries can be chained, where execution precedence is taken into account as per
	// the normal arithmetic rules.
	Parser.prototype.parse_binary = function( lhs ) {
		var token = this.tokens.current(),
			lhs = lhs || this.current.last,
			op;
		
		if(
			lhs && (
				token.type == _t.op_arm && lhs.name == 'comma' ||
				// The left hand side is a binary, so it has 3 children:
				// a lhs, an operator and a rhs. Perform an action based on
				// its operator.
				lhs.name == 'binary' && (
					(
						lhs.children[1].type == _t.op_cmp &&
						token.data != '||'
					) || (
						(token.data == '*' || token.data == '/') &&
						(lhs.children[1].value == '+' || lhs.children[1].value == '-')
					)
				)
			)
		) {
			this.current = lhs;
			this.parse_binary(lhs.last);
			this.up();
			
			return;
		} else if( lhs ) {
			this.wrap('binary');
			op = this.addup('operator');
			op.value = token.data;
			op.type = token.type;
			
			this.tokens.skip(true);
			this.parse();
			this.up();
		} else {
			throw 'jsq_parse_binary: Unexpected '+this.tokens.current().data+' at position '+this.tokens.current().index;
		}
	};
	// Creates a comma separated list of expressions. These lists cannot
	// be nested. Lists can be nested inside parenthesis and square/curly brackets.
	Parser.prototype.parse_comma = function() {
		var len = this.current.children.length,
			cur = this.current,
			peek;
		
		// Is this comma nested?
		while( cur ) {
			if( cur.name == 'comma' )
				throw 'jsq_parse_comma: Unexpected , at position '+this.tokens.current().index;
			cur = cur.parent;
		}
		
		if( len && (cur = this.current.children[len-1]).name == 'comma' ) {
			this.current = cur;
		} else if( len ) {
			this.wrap('comma');
		} else {
			throw 'jsq_parse_comma: Unexpected , at position '+this.tokens.current().index;
		}
		
		while(
			(peek = this.tokens.peek(true)) &&
			peek.data != ',' &&
			peek.data != ')' &&
			peek.data != ']' &&
			peek.data != '}' &&
			peek.data != '|'
		) {
			this.tokens.skip(true);
			this.parse();
		}
		this.up();
	};
	Parser.prototype.parse_id = function() {
		var token = this.tokens.current();
		
		this.add('function_call').value = token.data;
		this.up();
	};
	// Pipes should take precedence over every other operator
	Parser.prototype.parse_pipe = function() {
		var peek;
		
		this.wrap('pipe');
		
		while(
			(peek = this.tokens.peek(true)) &&
			peek.data != '|'
		) {
			this.tokens.skip(true);
			this.parse();
		}
		this.up();
	};
	// Parses a literal, or an object filter
	// Filter examples:
	//   .
	//   .[]
	//   .[foo]
	//   .["foo"]
	//   .[2]
	//   .["foo"][2]
	//   .[foo][][4]
	//   etc.
	Parser.prototype.parse_filter = function() {
		var token, literal, peek,
			current, parent;
		
		// TODO:
		// Two filters next to eachother without comma, pipe etc. should throw.
		
		// Is this a literal?
		token = this.tokens.current();
		if(
			token && (
				token.type == _t.flt ||
				token.type == _t.itg ||
				token.type == _t.str
			)
		) {
			if( token.type == _t.str ) {
				current = this.add('string');
				current.value = token.data;
			} else {
				current = this.add('number');
				current.value = parseFloat(token.data);
			}
			
			this.up();
			parent = this.current;
			
			literal = true;
		} else {
			current = this.add('filter');
			parent = current.parent;
		}
		
		while(
			(peek = this.tokens.peek()) &&
			peek.type != _t.wsp &&
			peek.type != _t.op_arm &&
			peek.type != _t.op_cmp &&
			peek.data != ')' &&
			peek.data != '}' &&
			peek.data != ']' &&
			peek.data != '|' &&
			peek.data != ','
		) {
			token = this.tokens.next();
			// If this filter follows a literal, throw
			if( !literal && token.data == '[' ) {
				token = this.tokens.next();
				if(
					token && (
						token.type == _t.vrb ||
						//token.type == _t.id  ||
						token.type == _t.itg ||
						token.type == _t.str
					)
				) {
					this.add( token.type == _t.itg ?
						'key_num' :
						'key_name'
					).value = token.data;
					this.up();
					
					token = this.tokens.next();
					if( token && token.data == ']' )
						continue;
				} else if(
					token &&
					token.data == ']'
				) {
					this.add('key_all').value = '.';
					this.up();
					continue;
				}
			}
			
			if( token )
				throw 'jsq_parse_filter: Unexpected \''+token.data+'\' at position '+token.index;
			else
				throw 'jsq_parse_filter: Unexpected EOF';
		}
		
		if( this.current.name == 'filter' )
			this.up();
	};
	Parser.prototype.toJSON = function( branch ) {
		var ret = {},
			key;
		
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
			throw 'jsq_up: Fatal internal error. Bug?';
		}
	};
	// Say you have:
	//    program > filter
	// Now when you do wrap('comma'):
	//    program > comma > filter
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
	function run( input, output, branch ) {
		if( branch.children && branch.children.length ) {
			switch( branch.children[0].name ) {
				default:
					_expression(input, output, branch.children[0]);	
			}
		}
		
		return output;
	}
	function _binary( input, output, branch ) {
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
		
		for( i=0; i<l.length; i++ ) {
			for( j=0; j<r.length; j++ ) {
				switch( op ) {
					// Perform arithmetic operation on values
					case '+':
						if( !(l[i] instanceof Object || r[j] instanceof Object) )
							ret = l[i] + r[j];
						else if( l[i] instanceof Array || r[j] instanceof Array )
							ret = _concat(l[i], r[j]);
						else if( l[i] instanceof Object && r[j] instanceof Object )
							ret = _extend({}, l[i], r[j]);
						break;
					case '-':
						if( l[i] instanceof Object || r[j] instanceof Object )
							ret = _without(l[i], r[j]);
						else
							ret = l[i] - r[j];
						break;
					case '*':
					case '/':
					case '&&':
					case '||':
					case '==':
					case '!=':
					case '>=':
					case '<=':
					case '>':
					case '<':
						ret = _binary.op[op](l[i], r[j]);
						break;
				}
				ret != void(0) && output.push(ret);
				ret = void(0);
			}
		}
	}
	_binary.op = {
		'*':  function( l, r ) { return l * r },
		'/':  function( l, r ) { return l / r },
		'&&': function( l, r ) { return l && r },
		'||': function( l, r ) { return l || r },
		'==': function( l, r ) { return l == r },
		'!=': function( l, r ) { return l != r },
		'>=': function( l, r ) { return l >= r },
		'<=': function( l, r ) { return l <= r },
		'>':  function( l, r ) { return l > r },
		'<':  function( l, r ) { return l < r }
	};
	function _expression( input, output, branch ) {
		switch( branch.name ) {
			case 'binary':
				_binary(input, output, branch);
				break;
			case 'collect':
				var col = [];
				_expression(input, col, branch.children[0]);
				output.push(col);
				break;
			case 'comma':
				for( var i=0; i<branch.children.length; i++ ) {
					_expression(input, output, branch.children[i]);
				}
				break;
			case 'filter':
				_filter(input, output, branch.children);
				break;
			case 'number':
			case 'string':
				output.push(branch.value);
				break;
			case 'parens':
				_expression(input, output, branch.children[0]);
				break;
			case 'pipe':
				input = _expression(input, output, branch.children[0]);
				input = input.splice(0,input.length);
				_expression(input, output, branch.children[1]);
				break;
		}
		return output;
	}
	function _filter( input, output, filter ) {
		var child, i, key, result;
		
		if( !filter.length )
			return output.push(input);
		
		filter = filter.slice(0);
		child = filter.shift();
		if( input instanceof Array ) {
			if( child.name == 'key_all' ) {
				for( i=0; i<input.length; i++ )
					_filter(input[i], output, filter);
			} else if( child.name == 'key_num' ) {
				_filter(input[child.value] != void(0) ? input[child.value] : null, output, filter);
			}
		} else if( input instanceof Object ) {
			if( child.name == 'key_all' ) {
				for( key in input )
					_filter(input[key], output, filter);
			} else {
				_filter(child.value in input ? input[child.value] : null, output, filter);
			}
		} else {
			return;
		}
	}
	
	// Public jsq() function
	var jsq = function( data, query, callback, context ) {
		var parser = new Parser(query);
		parser.parse();
		
		var output = [];
		return run(data, output, parser.tree);
	};
	jsq['Lexer'] = Lexer;
	jsq['Parser'] = Parser;
	
	_exports['jsq'] = jsq;
})(typeof exports=='undefined'?window:exports);