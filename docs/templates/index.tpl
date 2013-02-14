<!DOCTYPE html>
<html>
<head>
	<title>jsq - JSON Wrangler</title>
	
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<link rel="stylesheet" type="text/css" href="index.css">
</head>
<body>
	<div id="all">
		<div id="header"></div>
		
		{{{intro}}}
		
		{{#sections}}
		<section>
			<h2>{{{title}}}</h2>
			{{{body}}}
			
			{{#entries}}
			<div>
				<h3>{{{title}}}</h3>
				{{{body}}}
			</div>
			{{/entries}}
		</section>
		{{/sections}}
	</div>
</body>
</html>