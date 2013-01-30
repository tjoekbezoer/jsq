describe("The interpreter", function() {
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
	
	describe("executes", function() {
		it("binary operations correctly", function() {
			// Arithmetic
			expect(jsq(null, '1+2')).toEqual([3]);
			expect(jsq(null, '2-1')).toEqual([1]);
			expect(jsq(null, '2*3')).toEqual([6]);
			expect(jsq(null, '1.5*2')).toEqual([3]);
			expect(jsq(null, '9/3')).toEqual([3]);
			expect(jsq(null, '6/4')).toEqual([1.5]);
			// Precedence
			expect(jsq(null, '1+2*3+2')).toEqual([9]);
			expect(jsq(null, '(1+2)*3+2')).toEqual([11]);
			expect(jsq(null, '1+4/2+1')).toEqual([4]);
			expect(jsq(null, '(2+4)/3+1')).toEqual([3]);
			expect(jsq(null, '((2+4)*2+3)*2')).toEqual([30]);
			
			// Logical
			expect(jsq(null, '1&&2, 2&&1, 1 && 2, 1	&&	2')).toEqual([2,1,2,2]);
			expect(jsq(null, '1&&0, 0&&1')).toEqual([0,0]);
			expect(jsq(null, '1||2, 2||1, 1||0')).toEqual([1,2,1]);
			expect(jsq(null, '1==1, 2!=1, 2>1, 2>=1, 1>=1, 1<2, 1<=2, 1<=1')).toEqual([true,true,true,true,true,true,true,true]);
			expect(jsq(null, '2==1, 1!=1, 1>2, 1>=2, 2<1, 2<=1')).toEqual([false,false,false,false,false,false]);
			// Precedence
			expect(jsq(null, '1||2&&3')).toEqual([1]);
			expect(jsq(null, '(1||2)&&3')).toEqual([3]);
			expect(jsq(null, '0||2&&3')).toEqual([3]);
		});
		
		it("filters correctly", function() {
			// Simple object
			expect(jsq(simple, '.')).toEqual([simple]);
			expect(jsq(simple, '.[]')).toEqual([1,2,3,4]);
			expect(jsq(simple, '.["second"]')).toEqual([2]);
			expect(jsq(simple, '.second')).toEqual([2]);
			
			// Complex object
			expect(jsq(complex, '.[]')).toEqual([1,2,3,complex['fourth'],complex['fifth'],complex["sixth"]]);
			expect(jsq(complex, '.["fifth"]["baz"], .["fifth"].baz, .fifth["baz"], .fifth.baz')).toEqual([3,3,3,3]);
			expect(jsq(complex, '.fifth[]')).toEqual(['bar',3]);
			expect(jsq(complex, '.fourth')).toEqual([complex["fourth"]]);
			expect(jsq(complex, '.fourth[]')).toEqual(complex["fourth"]);
			// Expression as key
			expect(jsq(complex, '.fourth[.fourth[0]]')).toEqual([2]);
			expect(jsq(complex, '.[.sixth[]]')).toEqual([1,2]);
		});
		
		it("pipes correctly", function() {
			expect(jsq(null, '2 | .')).toEqual([2]);
			expect(jsq(null, '1,2 | .')).toEqual([1,2]);
			expect(jsq(null, '[1,2] | .')).toEqual([[1,2]]);
			expect(jsq(complex, '.fifth | .baz')).toEqual(jsq(complex, '.fifth.baz'));
			expect(jsq(complex, '.[]')).toEqual(jsq(complex, '. | .[]'));
			expect(jsq(complex, '.fifth[]')).toEqual(jsq(complex, '.fifth | .[]'));
		});
		
		it("comma separated values correctly", function() {
			expect(jsq(null, '1,2,3')).toEqual([1,2,3]);
			expect(jsq(null, '1,2,3 | .')).toEqual([1,2,3]);
			expect(jsq(null, '1,2,3 | .[]')).toEqual([]);
			expect(jsq(null, '[1,2,3] | .[]')).toEqual([1,2,3]);
			expect(jsq([1,2,3,4,5,6], '.[1,2,3]')).toEqual([2,3,4]);
		});
	});
});