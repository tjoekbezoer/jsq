QUnit.module('jsq function');
test('runs with all argument combinations', function() {
	deepEqual(jsq(), [], 'No arguments');
	
	// Return value
	deepEqual(jsq([1,2], '.[]'), [1,2], 'Return value with input');
	deepEqual(jsq([1,2], [3,4], 'add, keys'), [3,0,1,7,0,1], 'Return value with multiple inputs');
	deepEqual(jsq('1,2'), [1,2], 'Return value without input');
	
	// Calling jsq with empty query
	deepEqual(jsq({'foo': 'bar'}, ''), [], 'Empty query with input');
	deepEqual(jsq(''), [], 'Empty query without input');
	
	// Callback
	var test = 0;
	jsq([1,2], '.[]', function( i ) {test += i});
	equal(test, 3, 'Using iterator with input');
	
	jsq('1,2', function( i ) {test += i});
	equal(test, 6, 'Using iterator without input');
	
	jsq('1,2', function( i ) {test += i; return false});
	equal(test, 7, 'Short-circuit iterator by returning false');
	
	// Callback with context
	test = {foo: 0};
	jsq('1,2', function( i ) {this.foo+=i}, test);
	equal(test.foo, 3, 'Using iterator with context');
});