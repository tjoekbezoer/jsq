
describe("The lexer", function() {
	
	it("is constructable without query", function() {
		var lexer = new jsq.Lexer();
		
		expect(lexer instanceof jsq.Lexer).toBe(true);
	});
		
	it("should understand all supported tokens", function() {
		var lexer = new jsq.Lexer('12_aB_1_+3.2"a1!@#\\\""-+*/$aB_1_+++1---1.[a]("a"),&&||==!=>=<=<>: {}'),
			result = [{"type":8,"index":2,"data":"12"},{"type":6,"index":8,"data":"_aB_1_"},{"type":2,"index":9,"data":"+"},{"type":7,"index":12,"data":"3.2"},{"type":9,"index":21,"data":"\"a1!@#\\\"\""},{"type":2,"index":22,"data":"-"},{"type":2,"index":23,"data":"+"},{"type":2,"index":24,"data":"*"},{"type":2,"index":25,"data":"/"},{"type":5,"index":31,"data":"$aB_1_"},{"type":1,"index":33,"data":"++"},{"type":2,"index":34,"data":"+"},{"type":8,"index":35,"data":"1"},{"type":1,"index":37,"data":"--"},{"type":2,"index":38,"data":"-"},{"type":8,"index":39,"data":"1"},{"type":4,"index":40,"data":"."},{"type":4,"index":41,"data":"["},{"type":6,"index":42,"data":"a"},{"type":4,"index":43,"data":"]"},{"type":4,"index":44,"data":"("},{"type":9,"index":47,"data":"\"a\""},{"type":4,"index":48,"data":")"},{"type":4,"index":49,"data":","},{"type":3,"index":51,"data":"&&"},{"type":3,"index":53,"data":"||"},{"type":3,"index":55,"data":"=="},{"type":3,"index":57,"data":"!="},{"type":3,"index":59,"data":">="},{"type":3,"index":61,"data":"<="},{"type":3,"index":62,"data":"<"},{"type":3,"index":63,"data":">"},{"type":4,"index":64,"data":":"},{"type":10,"index":65,"data":" "},{"type":4,"index":66,"data":"{"},{"type":4,"index":67,"data":"}"}];
		
		expect(lexer.tokens).toEqual(result);
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