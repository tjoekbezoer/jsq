
describe("The lexer", function() {
	
	it("is constructable without query", function() {
		var lexer = new jsq.Lexer();
		
		expect(lexer instanceof jsq.Lexer).toBe(true);
	});
		
	it("understands all supported tokens", function() {
		var lexer = new jsq.Lexer('12_aB_1_+3.2"a1!@#\\\""-+*/$aB_1_+++1---1.[a]("a"),&&||==!=>=<=<>: {}'),
			result = [];
		
		//expect(lexer.tokens).toEqual(result);
	});
	
	describe("method", function() {
		it("next() works as expected", function() {
			var lexer = new jsq.Lexer('1+2+3');
			
			expect(lexer.next().data).toBe('+');
			expect(lexer.next(2).data).toBe('+');
			expect(lexer.next(10)).toBeNull();
		});
		
		it("current() works as expected", function() {
			var lexer = new jsq.Lexer('1+2');
			
			expect(lexer.current().data).toBe('1');
			lexer.next();
			expect(lexer.current().data).toBe('+');
			lexer.next(2);
			expect(lexer.current()).toBeNull();
		});
		
		it("peek() works as expected", function() {
			var lexer = new jsq.Lexer('1+ 2	 +3');
			
			expect(lexer.peek().data).toBe('+');
			lexer.next();
			expect(lexer.peek().data).toBe(' ');
			expect(lexer.peek(true).data).toBe('2');
			lexer.next(2);
			expect(lexer.peek(true).data).toBe('+');
			lexer.next(10);
			expect(lexer.peek()).toBeNull();
			expect(lexer.peek(true)).toBeNull();
		});
		
		it("skip() works as expected", function() {
			var lexer = new jsq.Lexer('1+ 2	 +3');
			
			lexer.skip();
			expect(lexer.current().data).toBe('1');
			lexer.skip(true);
			expect(lexer.current().data).toBe('+');
			lexer.skip();
			expect(lexer.next().data).toBe('2');
			expect(lexer.skip(true).data).toBe('+');
			lexer.skip();
			expect(lexer.current().data).toBe('+');
			
			// EOF tests
			expect(lexer.skip()).toBe(true);
			lexer.next();
			expect(lexer.skip()).toBe(false);
		});
	});
});