
describe("The lexer", function() {
	
	it("is constructable without query", function() {
		var lexer = new jsq.Lexer();
		
		expect(lexer instanceof jsq.Lexer).toBe(true);
	});
});