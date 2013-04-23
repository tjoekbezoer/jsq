
if( document.querySelectorAll ) {
	var examples = document.querySelectorAll('div.examples');
	for( var i=0; i<examples.length; i++ ) {
		var col = examples[i];
		// Can't be bothered...
		if( !col.classList ) break;
		
		// Remove empty example tables.
		if( !col.querySelectorAll('table tr:first-child').length ) {
			col.parentNode.removeChild(col);
			continue;
		}
		
		// Buttonize the 'Examples' header text...
		var button = col.querySelectorAll('.header')[0];
		var table = col.querySelectorAll('div.table')[0];
		// and enable animation on the visibility toggling.
		table.classList.add('animate');
		button.onclick = (function( button, table ) {
			return function() {
				button.classList.toggle('visible');
				table.classList.toggle('visible');
			};
		})(button, table);
	}
}