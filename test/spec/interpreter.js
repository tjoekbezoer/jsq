
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
	var complex2 = [{
		"first": [1,2,3]
	}, {
		"first": [4,5,6]
	}];
	var multiple = [{
		"first": 1,
		"second": 2,
		"third": 3
	}, {
		"first": 4,
		"second": 5
	}];
	
	function eq( input, query, result, title ) {
		if( typeof input == 'string' ) {
			title = result;
			result = query;
			query = input;
			input = [];
		}
		
		deepEqual(jsq(input, query), result, title||query);
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
		// Mixed values (array+array, array-array, etc).
		eq(multiple, '.[0]+.[1]', [{first:4, second:5, third:3}], 'Adding objects');
		eq(multiple, '.[0]-.[1]', [{third:3}], 'Subtracting objects');
		eq(multiple, '.[0] as $obj | .[0]-.[1]', [{first:1, second:2, third:3}], 'Arithmetic on objects is by value');
		eq('[1,2]+[3,4]', [[1,2,3,4]], 'Adding arrays');
		eq('[1,2,3,3,4] - [2,3]', [[1,4]], 'Subtracting arrays');
		eq('[1,2]+3', [[1,2,3]], 'Adding scalar to array');
		eq('[1,2,3,3,4]-3', [[1,2,4]], 'Subtracting scalar from array');
		
		// Logical
		eq('1&&2, 2&&1, 1 && 2, 1	&&	2', [2,1,2,2]);
		eq('1&&0, 0&&1', [0,0]);
		eq('1||2, 2||1, 1||0', [1,2,1]);
		// Precedence
		eq('1||2&&3', [1]);
		eq('(1||2)&&3', [3]);
		eq('0||2&&3', [3]);
		// Comparing
		eq('1==1, 2!=1, 2>1, 2>=1, 1>=1, 1<2, 1<=2, 1<=1', [true,true,true,true,true,true,true,true]);
		eq('2==1, 1!=1, 1>2, 1>=2, 2<1, 2<=1', [false,false,false,false,false,false]);
		eq('"foo"=="foo", "foo">"bar", "foo1">"foo"', [true,true,true]);
		eq('""==false', [true]);
		eq('"1"==1, "1"===1', [true,false]);
		eq('1>"0", "0"<"1"', [true,true]);
		// Comparing arrays
		eq('[1,2]==[1,2], [1,2]==[1,3], [1,2]==[2,1]', [true,false,false]);
		eq('[1,2]>=[1,2], [1,3]>=[1,2], [1,2,3]>=[4,5]', [true,true,true]);
		eq('[1,2]<=[1,2], [1,2]<=[1,3], [4,5]<=[1,2,3]', [true,true,true]);
		eq('[3,4]>[1,2], [3,4]>[3,1], [1,2,3]>[5,6]', [true,true,true]);
		eq('[1,2]<[3,4], [3,1]<[3,4], [5,6]<[1,2,3]', [true,true,true]);
		// Comparing objects
		eq('{foo:1, bar:2} == {foo:1, bar:2}', [true]);
		eq('{foo:1, bar:2} != {foo:1, bar:2}', [false]);
		eq('{foo:1, bar:2} != {foo:1, bar:3}', [true]);
		eq('{foo:1, bar:2} == {foo:1, bar:3}', [false]);
		eq('{foo:1, bar:[1,2]} == {foo:1, bar:[1,2]}', [true]);
		eq('{foo:1, bar:[1,2]} == {foo:1, bar:[1,3]}', [false]);
		eq('{foo:1, bar:[1,3]} > {foo:1, bar:[1,2]}', [true]);
		// Comparing mixed
		eq('null<false, null<true, null<0, null<1, null<"", null<"a", null<[], null<{}', [true,true,true,true,true,true,true,true]);
		eq('null==null, null==false, null==true, null==0, null==1, null=="", null=="a", null==[], null=={}', [true,false,false,false,false,false,false,false,false]);
		eq('false>null, false<true, false<0, false<1, false<"", false<"a", false<[], false<{}', [true,true,true,true,true,true,true,true]);
		// CAUTION: [] is not an array, but an empty collection which evaluates to nothing. So []==false!
		eq('false==false, false==true, false==0, false==1, false=="", false=="a", false==[], false=={}', [true,false,true,false,true,false,true,false]);
		eq('true>null, true>false, true<0, true<1, true<"", true<"a", true<[], true<{}', [true,true,true,true,true,true,true,true]);
		eq('true==0, true==1, true=="", true=="a", true==[], true=={}', [false,true,false,false,false,false]);
		// Comparing strings and numbers happens the 'JavaScript way'.
		eq('0>null, 0>false, 0>true, 0<1, 0<"", 0<"a", 0<[], 0<{}', [true,true,true,true,false,false,true,true]);
		eq('1>null, 1>false, 1>true, 1>0, 1<"", 1<"a", 1<[], 1<{}', [true,true,true,true,false,false,true,true]);
		eq('0==0, 0==1, 0=="", 0=="a", 0==[], 0=={}', [true,false,true,false,true,false]);
		
		
		// Bitwise
		eq('1or2', [3]);
		eq('3and7', [3]);
		eq('1xor2, 1xor3', [3,2]);
		// Precedence
		eq('2or5and4, (2or5)and4', [6,4]);
		eq('2and6or8, 2and(6or8)', [10,2]);
		eq('7xor5and4, (7xor5)and4', [3,0]);
		eq('6and4xor8, 6and(4xor8)', [12,4]);
		eq('7xor5or4, 7xor(5or4)', [6,2]);
		eq('6or5xor4, (6or5)xor4', [7,3]);
	});

	test('executes filters correctly', function() {
		// Simple object
		eq(simple, '.', [simple]);
		eq(simple, '.[]', [1,2,3,4]);
		eq(simple, '.["second"]', [2]);
		eq(simple, '.second', [2]);
		
		// Complex object
		eq(complex, '.[]', [1,2,3,complex['fourth'],complex['fifth'],complex['sixth'],complex['seventh']], 'All child elements');
		eq(complex, '.["fifth"]["baz"], .["fifth"].baz, .fifth["baz"], .fifth.baz', [3,3,3,3], 'Sub-keys');
		eq(complex, '.fifth.sub.notfound', [], 'Unfound sub-keys on object');
		eq(complex, '.fourth.sub.notfound', [], 'Unfound sub-keys on array');
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
		
		eq(complex2, '.[] | .first | add', [6,15], 'Multiple pipes');
		eq(complex2, '.[] | (.first | add)', [6,15], 'Multiple pipes but nested with parentheses yields same result');
	});

	test('executes comma separated values correctly', function() {
		eq('1,2,3', [1,2,3]);
		eq('1,2,3 | .', [1,2,3]);
		eq('1,2,3 | .[]', []);
		eq('[1,2,3] | .[]', [1,2,3]);
		eq([1,2,3,4,5,6], '.[1,2,3]', [2,3,4]);
		
		eq('1,1or2,2+1,4', [1,3,3,4]);
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
		eq(complex, '{first: .second, second: (.fourth | add)}', [{first: 2, second: 36}], 'With expressions as values');
		eq(complex, '.sixth as $var | {.fifth.foo: 1, $var[1]: 2}', [{bar: 1, second: 2}], 'With expressions as keys');
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
	
	test('executes variable assignments correctly', function() {
		eq('1 as $test | $test', [1]);
		eq('1 as $test | -$test, $test-1, 2-$test, $test+1, 2+$test', [-1,0,1,2,3]);
		
		eq(simple, '"second" as $key | .[$key]', [2]);
		eq(simple, '("second","third") as $key | .[$key]', [2,3]);
		eq(complex, '.sixth[] as $key | .[$key]', [1,2]);
		eq(complex, '.fifth as $obj | $obj["foo"]', ['bar']);
		eq(complex, '.fifth as $obj | $obj.sub.one', [1]);
		eq(complex, '.fifth.foo as $obj | $obj', ['bar']);
		
		eq(complex, '.fifth as $var | $var["foo"]', ['bar']);
		eq(complex, '.fifth as $var | $var[.seventh[0]]', ['bar']);
	});
	
	test('executes value assignment correctly', function() {
		var input1 = {
			'first': 1,
			'second': 2
		};
		var input2 = {
			'first': 1,
			'second': {
				'sub1': 2,
				'sub2': 3
			}
		};
		
		eq(input1, '.first = 2', [{
			'first':2,
			'second': 2
		}], 'Simple assignment');
		eq(input1, '.third = 3', [{
			'first': 1,
			'second': 2,
			'third': 3
		}], 'Assigning to an unknown key creates it');
		eq(input1, '.first = .third', [{
			'first': null,
			'second': 2
		}], 'Assigning an unfound filter sets lhs to null');
		deepEqual(input1, {
			'first': 1,
			'second': 2
		}, 'Assignments are non-destructive to the original input');
		eq(input2, '.second.sub1 = 4', [{
			'first': 1,
			'second': {
				'sub1': 4,
				'sub2': 3
			}
		}], 'Assignment on sub-element');
		deepEqual(input2, {
			'first': 1,
			'second': {
				'sub1': 2,
				'sub2': 3
			}
		}, 'Assignments on sub-elements are non-destructive to the original input');
		
		eq(input1, '.[] = 3', [{
			'first': 3,
			'second': 3
		}], 'Assigning multiple elements at once');
		eq(input2, '.second[] = 4 | .[].sub2 = 5', [{
			'first': 1,
			'second': {
				'sub1': 4,
				'sub2': 5
			}
		}], 'Assigning multiple sub-elements at once');
		
		eq(multiple, '.[0].first = .[1] | .[0].first.first = 6 | .[1]', [{
			'first': 4,
			'second': 5
		}], 'Assignment is by value, not by reference');
		
		eq(input2, '.second |= .sub1', [{'first': 1, 'second': 2}], 'Update assignment');
		eq(input2, '.second |= .sub3', [{'first': 1, 'second': null}], 'Assigning an unfound sub-filter sets lhs to null');
		eq(input2, '.third |= .', [{
			'first': 1,
			'second': {
				'sub1': 2,
				'sub2': 3
			},
			'third': null
		}], 'Assigning to an unknown key creates it and sets it to null');
	});
	
	
	module('Standard functions');
	test('add', function() {
		eq('[1,2,3] | add', [6]);
	});
	
	test('if', function() {
		eq({foo:'bar'}, 'if(.foo=="bar", 1, 0)', [1]);
	});
	
	test('empty', function() {
		eq('1,2,empty,4', [1,2,4]);
	});
	
	test('format', function() {
		eq('[1,2] | format("first:%0, second:%1")', ["first:1, second:2"]);
	});
	
	test('keys', function() {
		eq(simple, 'keys', ['first','second','third','fourth']);
	});
	
	test('length', function() {
		eq(complex, '(.fourth | length), (.fifth | length)', [8,3]);
	});
	
	test('map', function() {
		eq(complex, '.fourth | map(.+1)', [2,3,4,5,6,7,8,9]);
		eq(complex, '.fifth.sub | map(.+1)', [2,3]);
	});
	
	test('max', function() {
		eq(multiple, '.[0] | max', [3]);
		eq(multiple, 'max(.first)', [{first:4, second:5}]);
	});
	
	test('min', function() {
		eq(multiple, '.[0] | min', [1]);
		eq(multiple, 'min(.first)', [{first:1, second:2, third: 3}]);
	});
	
	test('pairs', function() {
		eq(multiple, '.[1] | pairs', [['first',4], ['second',5]]);
	});
	
	test('recurse', function() {
		var recursive = {
			"name": "1", "children": [
				{"name": "1-1", "children": [
					{"name": "1-1-1", "children": []},
					{"name": "1-1-2", "children": []}
				]},
				{"name": "1-2"}
			]
		};
		
		eq(recursive, 'recurse(.children[]) | .name', ['1','1-1','1-1-1','1-1-2','1-2']);
	});
	
	test('select', function() {
		eq(simple, '.[] | select(.>=3)', [3,4]);
	});
	
	test('sort', function() {
		eq([1,3,2], 'sort', [[1,2,3]]);
		eq(['a', 'ab', 'aa', 'A'], 'sort', [['A', 'a', 'aa', 'ab']]);
		eq([true,false,1,null,'a',{},[]], 'sort', [[null,false,true,1,'a',[],{}]]);
		
		// Sorting arrays
		eq([[6,1,0], [1,2,3,4], [5,6,7]], 'sort', [[[5,6,7], [6,1,0], [1,2,3,4]]]);
		eq([[3,4,5], [1,2,3]], 'sort', [[[1,2,3], [3,4,5]]]);
		eq([['a', 'c'], ['a', 'b']], 'sort', [[['a','b'], ['a','c']]]);
		
		// Sorting objects
		var obj1 = {foo:1, bar:2}
			, obj2 = {foo:2, bar:3}
			, obj3 = {foo:2, baz:2};
		eq([obj2, obj1], 'sort', [[obj1, obj2]]);
		eq([obj3, obj2], 'sort', [[obj2, obj3]]);
		obj4 = {foo:1, bar:[1,2,3]};
		obj5 = {foo:1, bar:[1,2,4]};
		eq([obj5, obj4], 'sort', [[obj4, obj5]]);
		obj5.bar[2] = 2;
		eq([obj5, obj4], 'sort', [[obj5, obj4]]);
	});
	
	test('tonumber', function() {
		eq('"1", "1foo", "foo1" | tonumber', [1,1,null]);
	});
	
	test('tostring', function() {
		eq('false, 1, [1,2,3] | tostring', ['false', '1', '[1,2,3]']);
	});
	
	test('unique', function() {
		eq('[1,2,2,3,"foo","bar","foo"] | unique', [[1,2,3,'foo','bar']]);
	});
})();