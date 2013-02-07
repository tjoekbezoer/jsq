
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

	module("Interpreter");
	test("executes binary operations correctly", function() {
		// Arithmetic
		deepEqual(jsq(null, '1+2'), [3]);
		deepEqual(jsq(null, '2-1'), [1]);
		deepEqual(jsq(null, '2*3'), [6]);
		deepEqual(jsq(null, '1.5*2'), [3]);
		deepEqual(jsq(null, '9/3'), [3]);
		deepEqual(jsq(null, '6/4'), [1.5]);
		// Precedence
		deepEqual(jsq(null, '1+2*3+2'), [9]);
		deepEqual(jsq(null, '(1+2)*3+2'), [11]);
		deepEqual(jsq(null, '1+4/2+1'), [4]);
		deepEqual(jsq(null, '(2+4)/3+1'), [3]);
		deepEqual(jsq(null, '((2+4)*2+3)*2'), [30]);
		
		// Logical
		deepEqual(jsq(null, '1&&2, 2&&1, 1 && 2, 1	&&	2'), [2,1,2,2]);
		deepEqual(jsq(null, '1&&0, 0&&1'), [0,0]);
		deepEqual(jsq(null, '1||2, 2||1, 1||0'), [1,2,1]);
		deepEqual(jsq(null, '1==1, 2!=1, 2>1, 2>=1, 1>=1, 1<2, 1<=2, 1<=1'), [true,true,true,true,true,true,true,true]);
		deepEqual(jsq(null, '2==1, 1!=1, 1>2, 1>=2, 2<1, 2<=1'), [false,false,false,false,false,false]);
		// Precedence
		deepEqual(jsq(null, '1||2&&3'), [1]);
		deepEqual(jsq(null, '(1||2)&&3'), [3]);
		deepEqual(jsq(null, '0||2&&3'), [3]);
	});

	test("executes filters correctly", function() {
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

	test("executes pipes correctly", function() {
		deepEqual(jsq(null, '2 | .'), [2]);
		deepEqual(jsq(null, '1,2 | .'), [1,2]);
		deepEqual(jsq(null, '[1,2] | .'), [[1,2]]);
		deepEqual(jsq(complex, '.fifth | .baz'), jsq(complex, '.fifth.baz'));
		deepEqual(jsq(complex, '.[]'), jsq(complex, '. | .[]'));
		deepEqual(jsq(complex, '.fifth[]'), jsq(complex, '.fifth | .[]'));
	});

	test("executes comma separated values correctly", function() {
		deepEqual(jsq(null, '1,2,3'), [1,2,3]);
		deepEqual(jsq(null, '1,2,3 | .'), [1,2,3]);
		deepEqual(jsq(null, '1,2,3 | .[]'), []);
		deepEqual(jsq(null, '[1,2,3] | .[]'), [1,2,3]);
		deepEqual(jsq([1,2,3,4,5,6], '.[1,2,3]'), [2,3,4]);
	});
})();