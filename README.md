jsq
===

Take control of your JSON; slice, filter, map, transform, calculate — it's up to you. All in a purpose-designed, simple language. With GZIP, it's less than 5KB.

An example:

```javascript
var i = {
  "data": [
    {"uid": 1, "grades": [5,7,8]},
    {"uid": 2, "grades": [3,9,6]}
  ],
  "users": {
    1: {"name": "Bruce Willis"},
    2: {"name": "Samuel L. Jackson"}
  }
};

jsq(i, '.users as $u | .data[] | {$u[.uid].name: (.grades|max)}');
// » [{"Bruce Willis":8}, {"Samuel L. Jackson":9}]
```