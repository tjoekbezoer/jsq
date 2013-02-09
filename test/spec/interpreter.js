
(function() {
	var simple = {
		"first": 1,
		"second": 2,
		"third": 3,
		"fourth": 4
	};
	var complex = {
		"first": 1,
		"second": 2,
		"third": 3,
		"fourth": [1,2,3,4,5,6,7,8],
		"fifth": {
			"foo": "bar",
			"baz": 3
		},
		"sixth": ["first","second"]
	};

	module('Interpreter');
	test('executes unary operations correctly', function() {
		deepEqual(jsq('-1, ~1, !1'), [-1,-2,false]);
		deepEqual(jsq('1--1'), [2]);
		deepEqual(jsq('0>-1, 1--1'), [true,2]);
	});
	
	test('executes binary operations correctly', function() {
		// Arithmetic
		deepEqual(jsq('1+2'), [3]);
		deepEqual(jsq('2-1'), [1]);
		deepEqual(jsq('2*3'), [6]);
		deepEqual(jsq('1.5*2'), [3]);
		deepEqual(jsq('9/3'), [3]);
		deepEqual(jsq('6/4'), [1.5]);
		// Precedence
		deepEqual(jsq('1+2*3+2'), [9]);
		deepEqual(jsq('(1+2)*3+2'), [11]);
		deepEqual(jsq('1+4/2+1'), [4]);
		deepEqual(jsq('(2+4)/3+1'), [3]);
		deepEqual(jsq('((2+4)*2+3)*2'), [30]);
		
		// Logical
		deepEqual(jsq('1&&2, 2&&1, 1 && 2, 1	&&	2'), [2,1,2,2]);
		deepEqual(jsq('1&&0, 0&&1'), [0,0]);
		deepEqual(jsq('1||2, 2||1, 1||0'), [1,2,1]);
		deepEqual(jsq('1==1, 2!=1, 2>1, 2>=1, 1>=1, 1<2, 1<=2, 1<=1'), [true,true,true,true,true,true,true,true]);
		deepEqual(jsq('2==1, 1!=1, 1>2, 1>=2, 2<1, 2<=1'), [false,false,false,false,false,false]);
		// Precedence
		deepEqual(jsq('1||2&&3'), [1]);
		deepEqual(jsq('(1||2)&&3'), [3]);
		deepEqual(jsq('0||2&&3'), [3]);
		
		// Bitwise
		deepEqual(jsq('1\\2'), [3]);
		deepEqual(jsq('3&7'), [3]);
		deepEqual(jsq('1^2, 1^3'), [3,2]);
		// Precedence
		deepEqual(jsq('2\\5&4, (2\\5)&4'), [6,4]);
		deepEqual(jsq('2&6\\8, 2&(6\\8)'), [10,2]);
		deepEqual(jsq('7^5&4, (7^5)&4'), [3,0]);
		deepEqual(jsq('6&4^8, 6&(4^8)'), [12,4]);
		deepEqual(jsq('7^5\\4, 7^(5\\4)'), [6,2]);
		deepEqual(jsq('6\\5^4, (6\\5)^4'), [7,3]);
	});

	test('executes filters correctly', function() {
		// Simple object
		deepEqual(jsq(simple, '.'), [simple]);
		deepEqual(jsq(simple, '.[]'), [1,2,3,4]);
		deepEqual(jsq(simple, '.["second"]'), [2]);
		deepEqual(jsq(simple, '.second'), [2]);
		
		// Complex object
		deepEqual(jsq(complex, '.[]'), [1,2,3,complex['fourth'],complex['fifth'],complex["sixth"]]);
		deepEqual(jsq(complex, '.["fifth"]["baz"], .["fifth"].baz, .fifth["baz"], .fifth.baz'), [3,3,3,3]);
		deepEqual(jsq(complex, '.fifth[]'), ['bar',3]);
		deepEqual(jsq(complex, '.fourth'), [complex["fourth"]]);
		deepEqual(jsq(complex, '.fourth[]'), complex["fourth"]);
		// Expression as key
		deepEqual(jsq(complex, '.fourth[.fourth[0]]'), [2]);
		deepEqual(jsq(complex, '.[.sixth[]]'), [1,2]);
	});

	test('executes pipes correctly', function() {
		deepEqual(jsq('2 | .'), [2]);
		deepEqual(jsq('1,2 | .'), [1,2]);
		deepEqual(jsq('[1,2] | .'), [[1,2]]);
		deepEqual(jsq(complex, '.fifth | .baz'), jsq(complex, '.fifth.baz'));
		deepEqual(jsq(complex, '.[]'), jsq(complex, '. | .[]'));
		deepEqual(jsq(complex, '.fifth[]'), jsq(complex, '.fifth | .[]'));
	});

	test('executes comma separated values correctly', function() {
		deepEqual(jsq('1,2,3'), [1,2,3]);
		deepEqual(jsq('1,2,3 | .'), [1,2,3]);
		deepEqual(jsq('1,2,3 | .[]'), []);
		deepEqual(jsq('[1,2,3] | .[]'), [1,2,3]);
		deepEqual(jsq([1,2,3,4,5,6], '.[1,2,3]'), [2,3,4]);
		
		deepEqual(jsq('1,1\\2,2+1,4'), [1,3,3,4]);
	});
	
	test('executes collections correctly', function() {
		deepEqual(jsq('[1,2]'), [[1,2]]);
		deepEqual(jsq('[[1,2],[3,4]]'), [[[1,2],[3,4]]]);
		deepEqual(jsq(simple, '[.[]]'), [[1,2,3,4]]);
	});
	
	test('executes object creation correctly', function() {
		deepEqual(jsq('{"foo":1, "neg":-1, "bar":[1,2,3], "name":"baz", "bool":true, "pos":!!2, "last":~1}'), [{
			'foo': 1,
			'neg': -1,
			'bar': [1,2,3],
			'name': 'baz',
			'bool': true,
			'pos': true,
			'last': -2
		}], 'Object creation with simple values');
		deepEqual(jsq('{"first":1, "second":(1,2)}'), [{
			'first': 1,
			'second': 1
		}, {
			'first': 1,
			'second': 2
		}], 'Multiple objects are created when element value produces multiple results');
		deepEqual(jsq('{"first":(1,2), "second":(3,4)}'), [
			{'first':1, 'second':3},
			{'first':1, 'second':4},
			{'first':2, 'second':3},
			{'first':2, 'second':4}
		], 'Multiple element values that produce multiple results: cartesian product');
		deepEqual(jsq({"third":3, "2":true}, '{"first":1, "second":1,third,2}'), [{
			'first': 1,
			'second': 1,
			'third': 3,
			'2': true
		}], 'Shorthand element definitions');
		deepEqual(jsq('{"first":1, "second":1,third,2}'), [{
			'first': 1,
			'second': 1
		}], 'Non-matching shorthand element definitions are ignored');
	});
})();