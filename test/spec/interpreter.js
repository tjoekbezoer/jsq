
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
			"baz": 3,
			"sub": {
				"one": 1,
				"two": 2
			}
		},
		"sixth": ["first","second"],
		"seventh": ["foo", "bar"]
	};
	
	function eq( input, query, result, title ) {
		if( typeof input == 'string' ) {
			title = result;
			result = query;
			query = input;
			input = [];
		}
		
		deepEqual(jsq(input, query), result, title);
	}
	
	module('Interpreter');
	test('executes unary operations correctly', function() {
		eq('-1, ~1, !1, -2', [-1,-2,false,-2]);
		eq('1--1', [2]);
		eq('0>-1, 1--1', [true,2]);
	});
	
	test('executes binary operations correctly', function() {
		// Arithmetic
		eq('1+2', [3]);
		eq('2-1', [1]);
		eq('2*3', [6]);
		eq('1.5*2', [3]);
		eq('9/3', [3]);
		eq('6/4', [1.5]);
		// Precedence
		eq('1+2*3+2', [9]);
		eq('(1+2)*3+2', [11]);
		eq('1+4/2+1', [4]);
		eq('(2+4)/3+1', [3]);
		eq('((2+4)*2+3)*2', [30]);
		
		// Logical
		eq('1&&2, 2&&1, 1 && 2, 1	&&	2', [2,1,2,2]);
		eq('1&&0, 0&&1', [0,0]);
		eq('1||2, 2||1, 1||0', [1,2,1]);
		eq('1==1, 2!=1, 2>1, 2>=1, 1>=1, 1<2, 1<=2, 1<=1', [true,true,true,true,true,true,true,true]);
		eq('2==1, 1!=1, 1>2, 1>=2, 2<1, 2<=1', [false,false,false,false,false,false]);
		// Precedence
		eq('1||2&&3', [1]);
		eq('(1||2)&&3', [3]);
		eq('0||2&&3', [3]);
		
		// Bitwise
		eq('1\\2', [3]);
		eq('3&7', [3]);
		eq('1^2, 1^3', [3,2]);
		// Precedence
		eq('2\\5&4, (2\\5)&4', [6,4]);
		eq('2&6\\8, 2&(6\\8)', [10,2]);
		eq('7^5&4, (7^5)&4', [3,0]);
		eq('6&4^8, 6&(4^8)', [12,4]);
		eq('7^5\\4, 7^(5\\4)', [6,2]);
		eq('6\\5^4, (6\\5)^4', [7,3]);
	});

	test('executes filters correctly', function() {
		// Simple object
		eq(simple, '.', [simple]);
		eq(simple, '.[]', [1,2,3,4]);
		eq(simple, '.["second"]', [2]);
		eq(simple, '.second', [2]);
		
		// Complex object
		eq(complex, '.[]', [1,2,3,complex['fourth'],complex['fifth'],complex['sixth'],complex['seventh']]);
		eq(complex, '.["fifth"]["baz"], .["fifth"].baz, .fifth["baz"], .fifth.baz', [3,3,3,3]);
		eq(complex, '.fifth[]', ['bar',3,complex['fifth']['sub']]);
		eq(complex, '.fourth', [complex["fourth"]]);
		eq(complex, '.fourth[]', complex["fourth"], 'All children of a sub-key');
		eq([{'first':1}, {'first':2}], '.[].first', [1,2], 'Sub-key of all children');
		// Expression as key
		eq(complex, '.fourth[.fourth[0]]', [2]);
		eq(complex, '.[.sixth[]]', [1,2], 'Sub-expression in a filter');
		eq(complex, '.fifth[.seventh[0]]', ['bar'], 'Sub-expression in a sub-filter');
	});

	test('executes pipes correctly', function() {
		eq('2 | .', [2]);
		eq('1,2 | .', [1,2]);
		eq('[1,2] | .', [[1,2]]);
		deepEqual(jsq(complex, '.fifth | .baz'), jsq(complex, '.fifth.baz'));
		deepEqual(jsq(complex, '.[]'), jsq(complex, '. | .[]'));
		deepEqual(jsq(complex, '.fifth[]'), jsq(complex, '.fifth | .[]'));
	});

	test('executes comma separated values correctly', function() {
		eq('1,2,3', [1,2,3]);
		eq('1,2,3 | .', [1,2,3]);
		eq('1,2,3 | .[]', []);
		eq('[1,2,3] | .[]', [1,2,3]);
		eq([1,2,3,4,5,6], '.[1,2,3]', [2,3,4]);
		
		eq('1,1\\2,2+1,4', [1,3,3,4]);
	});
	
	test('executes collections correctly', function() {
		eq('[1,2]', [[1,2]]);
		eq('[[1,2],[3,4]]', [[[1,2],[3,4]]]);
		eq(simple, '[.[]]', [[1,2,3,4]]);
	});
	
	test('executes object creation correctly', function() {
		eq('{"foo":1, "neg": -1, "bar":[1,2,3], "name":"baz", "bool":true, "pos":!!2, "last":~1}', [{
			'foo': 1,
			'neg': -1,
			'bar': [1,2,3],
			'name': 'baz',
			'bool': true,
			'pos': true,
			'last': -2
		}], 'With simple values');
		eq([1,2], '{first: .}', [{'first': [1,2]}], 'Using filter as element value');
		eq([1,2], '{first: .[]}', [{'first': 1}, {'first': 2}], 'Using filter that produces multiple results as value');
		eq('{"first":1, "second":(1,2)}', [{
			'first': 1,
			'second': 1
		}, {
			'first': 1,
			'second': 2
		}], 'Using inline expression that produces multiple results as value');
		eq('{"first":(1,2), "second":(3,4)}', [
			{'first':1, 'second':3},
			{'first':1, 'second':4},
			{'first':2, 'second':3},
			{'first':2, 'second':4}
		], 'Using multiple inline expressions that produce multiple results: cartesian product');
		eq({"third":3, "2":true}, '{"first":1, "second":1,third,2}', [{
			'first': 1,
			'second': 1,
			'third': 3,
			'2': true
		}], 'Shorthand element definitions');
		eq({}, '{"first":1, "second":1,third,2}', [{
			'first': 1,
			'second': 1
		}], 'Non-matching shorthand element definitions are ignored when input is object');
		eq([], '{"first":1, "second":1,third,2}', [{
			'first': 1,
			'second': 1
		}], 'Non-matching shorthand element definitions are ignored when input is array');
	});
	
	test('executes variable definitions correctly', function() {
		eq('1 as $test | $test', [1]);
		eq('1 as $test | -$test, $test-1, 2-$test, $test+1, 2+$test', [-1,0,1,2,3]);
		
		eq(simple, '"second" as $key | .[$key]', [2]);
		eq(simple, '("second","third") as $key | .[$key]', [2,3]);
		eq(complex, '.sixth[] as $key | .[$key]', [1,2]);
		eq(complex, '.fifth as $obj | $obj["foo"]', ['bar']);
	});
})();