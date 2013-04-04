<!DOCTYPE html>
<html>
<head>
	<title>jsq - The JSON wrangler</title>
	
	<meta http-equiv="content-type" content="text/html; charset=utf-8">
	<link rel="stylesheet" type="text/css" href="index.css">
	<link rel="stylesheet" type="text/css" href="prism.css">
</head>
<body>
	<div id="all">
		<h1>{{{headline}}}</h1>
		
		{{{intro}}}
		
		<div id="header">
<pre class="lang-javascript"><code>var o = {
  "data": [
    {"uid": 1, "grades": [5,7,8]},
    {"uid": 2, "grades": [3,9,6]}
  ],
  "users": {
    1: {"name": "Bruce Willis"},
    2: {"name": "Samuel L. Jackson"}
  }
};

jsq(o, '.users as $u | .data[] | {$u[.uid].name: (.grades|max)}');
// » [{"Bruce Willis":8}, {"Samuel L. Jackson":9}]</pre></code>
			
			
		</div>
		
		<!-- <iframe id="watchButton" src="http://ghbtns.com/github-btn.html?user=tjoekbezoer&repo=jsq&type=watch"
		  allowtransparency="true" frameborder="0" scrolling="0" width="50" height="20"></iframe> -->
		
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
		
		<div id="legal">
			jsq is licensed under the <a href="//raw.github.com/tjoekbezoer/jsq/master/LICENSE-MIT">MIT license</a> (code)
			and the <a href="http://creativecommons.org/licenses/by/3.0/">CC-BY-3.0 license</a> (docs).
		</div>
	</div>
	
	<script type="text/javascript" src="prism.min.js"></script>
</body>
</html>