<!DOCTYPE html>
<html>
<head>
	<title>jsq - JSON Wrangler</title>
	
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<link rel="stylesheet" type="text/css" href="index.css">
</head>
<body>
	<div id="all">
		<h1>{{{headline}}}</h1>
		
		{{{intro}}}
		
		<div id="header">
			<pre><code><span class="statement">var</span> grades = {
  <span class="string">"data"</span>: [
    {<span class="string">"uid"</span>: <span class="number">1</span>, <span class="string">"grades"</span>: [<span class="number">5</span>,<span class="number">7</span>,<span class="number">9</span>]},
    {<span class="string">"uid"</span>: <span class="number">2</span>, <span class="string">"grades"</span>: [<span class="number">3</span>,<span class="number">9</span>,<span class="number">6</span>]}
  ],
  <span class="string">"users"</span>: {
    <span class="string">"1"</span>: {<span class="string">"name"</span>: <span class="string">"Bruce Willis"</span>},
    <span class="string">"2"</span>: {<span class="string">"name"</span>: <span class="string">"Samuel L. Jackson"</span>}
  }
};

<span class="call">jsq</span>(input, <span class="string">'.users as $u | .data[] | {$u[.uid].name: .grades}'</span>);
<span class="comment">» [{"Bruce Willis":[5,7,9]}, {"Samuel L. Jackson":[3,9,6]}]</span></code></pre>
		</div>
		
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
			
			<hr/>
		</section>
		{{/sections}}
	</div>
</body>
</html>