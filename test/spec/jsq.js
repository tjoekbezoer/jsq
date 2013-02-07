module("jsq function");
test("runs with all argument combinations", function() {
	// Return value
	deepEqual(jsq([1,2], '.[]'), [1,2], 'Return value with input');
	deepEqual(jsq('1,2'), [1,2], 'Return value without input');
	
	// Callback
	var test = 0;
	jsq([1,2], '.[]', function( i ) {test += i});
	equal(test, 3, 'Using iterator with input');
	
	jsq('1,2', function( i ) {test += i});
	equal(test, 6, 'Using iterator without input');
	
	// Callback with context
	test = {foo: 0};
	jsq('1,2', function( i ) {this.foo+=i}, test);
	equal(test.foo, 3, 'Using iterator with context');
});