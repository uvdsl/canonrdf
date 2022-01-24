# CanonRDF: Canonicalising RDF Graphs

This is a very simple implementation of the algorithms of Aidan Hogan, presented in [1].

The original implementation was done in Java [2].
Other another implementation in Javascript was created by Ivan Herman [3] (which is great, just not written using Typescript which I wanted to use).

The goal of this Typescript implementation is to (a) to make me understand the algorithms and (b) to work in a browser for my projects.
First, I tried to convert Ivan's implementation to Typescript but encountered several data type mismatches. 
Since I did not feel comfortable messing around in code I do not understand, I ended up writing my own interpretation of the algorithm from scratch.

For the sake of interoperability, I would also like to
make this implemenation have the same output as the original Java implementation on the same inputs.
However, there are alot of open questions regarding an exact implementation, e.g. ordering of graphs, carry-over of hash bags, hashing tuples, etc. (see [spec.md](./spec.md))

---
### Installation
This package relies on [N3.js](https://github.com/rdfjs/N3.js) for handling RDF, currently using version `1.12.2`.
```
npm install n3@1.12.2 --save
npm install canonrdf --save
```
---
### Usage Example
```js
const { isoCanonicalise } = require("canonrdf");
const { Store, Parser } = require("n3");

// the graph to relabel
const data = `
		_:a <p> _:b .
		_:b <p> _:c .
		_:c <p> _:a .
		_:x <p> _:y .
		_:y <p> _:z .
		_:z <p> _:x .
		<u> <p> <v> .
`
const store = new Store();
const parser = new Parser();
store.addQuads(parser.parse(data));

// show current labels
console.log(store._ids);

// use Hogan's algorithm
const relabeled = isoCanonicalise(store);

// print the new labels
console.log(relabeled._ids);
```
This example is in Javascript because it is convinient to access private property of `store._ids` to show that the graph has been relabeld.
When using Typescript, that line will make your compiler cry because `N3.js` does not an easy way to access the terms in the graph.
In Typescript, getting the terms is just cumberson and does not add to the example
(you can have a look at the relabeld terms within the quads from a `store.getQuads(...)` call if you really want to see the example in TS).

---
### References

[1] https://aidanhogan.com/docs/rdf-canonicalisation.pdf  
[2] https://github.com/aidhog/blabel/  
[3] https://github.com/iherman/canonical_rdf/  