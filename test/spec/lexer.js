
module('Lexer');

test('is constructable without query', function() {
	var lexer = new jsq.Lexer();
	
	ok(lexer instanceof jsq.Lexer);
});
	
test('understands all supported tokens', function() {
	var lexer = new jsq.Lexer('12_aB_1_+3.2"a1!@#\\\""-+*/$aB_1_+++1---1.[a]("a"),&&||==!=>=<=<>: {}'),
		result = [];
	
	ok(lexer instanceof jsq.Lexer);
	//expect(lexer.tokens).toEqual(result);
});

test('method next() works as expected', function() {
	var lexer = new jsq.Lexer('1+2+3');
	
	equal(lexer.next().data, '+');
	equal(lexer.next(2).data, '+');
	equal(lexer.next(10), null);
});

test('method current() works as expected', function() {
	var lexer = new jsq.Lexer('1+2');
	
	equal(lexer.current().data, '1');
	lexer.next();
	equal(lexer.current().data, '+');
	lexer.next(2);
	equal(lexer.current(), null);
});

test('method peek() works as expected', function() {
	var lexer = new jsq.Lexer('1+ 2	 +3');
	
	equal(lexer.peek().data, '+');
	lexer.next();
	equal(lexer.peek().data, ' ');
	equal(lexer.peek(true).data, '2');
	lexer.next(2);
	equal(lexer.peek(true).data, '+');
	lexer.next(10);
	equal(lexer.peek(), null);
	equal(lexer.peek(true), null);
});

test('method skip() works as expected', function() {
	var lexer = new jsq.Lexer('1+ 2	 +3');
	
	lexer.skip();
	equal(lexer.current().data, '1');
	lexer.skip(true);
	equal(lexer.current().data, '+');
	lexer.skip();
	equal(lexer.next().data, '2');
	equal(lexer.skip(true).data, '+');
	lexer.skip();
	equal(lexer.current().data, '+');
	
	// EOF tests
	equal(lexer.skip(), true);
	lexer.next();
	equal(lexer.skip(), false);
});

test('method back() works as expected', function() {
	var lexer = new jsq.Lexer('1+ 2	 +3');
	
	lexer.next(3);
	equal(lexer.back().data, '+');
	equal(lexer.current().data, '2');
	equal(lexer.back(2).data, '1');
	equal(lexer.back(5), false);
	equal(lexer.current().data, '2');
});