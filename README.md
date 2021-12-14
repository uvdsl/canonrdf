# CanonRDF: Canonicalising RDF Graphs

This is a very simple implementation of the algorithms of Aidan Hogan, presented in [1].

The original implementation was done in Java [2].
Other another implementation in Javascript was created by Ivan Herman [3] (which is great, just not written using Typescript which I wanted to use).

The goal of this Typescript implementation is to (a) to make me understand the algorithms and (b) to work in a browser for my projects.
First, I tried to convert Ivan's implementation to Typescript but encountered several data type mismatches. 
Since I did not feel comfortable messing around in code I do not understand, I ended up writing my own interpretation of the algorithm from scratch.

For the sake of interoperability, I would also like to
make this implemenation have the same output as the original Java implementation on the same inputs.

---
### [References](id:refs)

[1] https://aidanhogan.com/docs/rdf-canonicalisation.pdf  
[2] https://github.com/aidhog/blabel/  
[3] https://github.com/iherman/canonical_rdf/  