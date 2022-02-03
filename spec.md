# Underspecified Points around RDF Hashing
_Note_:  
iherman's [implementation](https://github.com/iherman/canonical_rdf) of `hashBNodes(.)` and my implementation of that function are equivalent (to my testing). However, we interpret the ordering of graphs differently (here: `isLowerOrderThan(.)`).  
The original [implementation](https://github.com/aidhog/blabel) in Java by aidhog is not equivalent to any of the aforementioned implementations (afaik), as the underlying RDF libraries handle the values of terms differently (see question 3).  
Also note the comments of iherman in his [repo](https://github.com/iherman/canonical_rdf) regarding open questions for specification.

---
### (1) Which hashing algorithm is chosen?
In the  [paper](https://aidanhogan.com/docs/rdf-canonicalisation.pdf), it is just stated that a "perfect hashing scheme" (page 16) should be chosen.
```js
// my implementation
const HASH_ALGO = 'md5';
```
For my implementation, I chose md5 as it is used in aidhog's [code](https://github.com/aidhog/blabel/blob/5dc9b3a8917e93cb5a5e1fb9583e2372b0a70c4e/src/main/java/cl/uchile/dcc/blabel/label/GraphLabelling.java#L194).
iherman chose md4 in his [code](https://github.com/iherman/canonical_rdf/blob/master/lib/Hash.js) but notes that his choice is just for simplicity and that the choice should be discussed.

---

### (2) What is the exact value of the constants?
The exact values of the constants are not defined in the [paper](https://aidanhogan.com/docs/rdf-canonicalisation.pdf). 
There, the symbols are simply used as distinguishing values.
```js
// my implementation
const INITIAL_BN_HASH = Buffer.alloc(16); 
const EDGE_OUT = Buffer.from('+'); 
const EDGE_IN = Buffer.from('-'); 
const MARKER = Buffer.from('@'); 
```
My implementation is equivalent to iherman's.

---

### (3) How exactly are terms handled for hashing?  
Does the string value of a __URI__ include the starting and closing brackets `< ... >` or is it only the inner value that is used for hashing? For example, [N3.js](https://github.com/rdfjs/N3.js) excludes the brackets, whereas [nxparser](https://github.com/nxparser/nxparser) (Java) includes the brackets.  
```js
// choose
const uri = '<http://example.org>'  ; // Option A
// or
const uri = 'http://example.org'    ; // Option B
```
Similarly, for the string value of __Blank Nodes__, are the starting `_:` included?  
```js
// choose
const bn  = '_:bn'  ; // Option A
// or
const bn  = 'bn'    ; // Option B
```
And for __Literals__...
```js
// choose 
const str   = '"test"^^xsd:string'  ; // Option A
const num   = '"0"^^xsd:integer'    ; // Option A
// or
const str   = '"test"'              ; // Option B
const num   = '0'                   ; // Option B
```
_Note:_ There may be other differences between implementations that I am not aware of.
Some answers may seem obvious :)

---

### (4) How exaclty is a `hashTuple` defined? (concatenation of inputs?)
```js
// my implementation
const hashTuple = (...data: Buffer[]) => {
    return hash(Buffer.concat(data));
}
```
My implementation is an adaptation from iherman.
(Quite handy syntax in the signature, I was not aware such things were allowed.)
Also, iherman [notes](https://github.com/iherman/canonical_rdf/blob/3cab75f65e54af8b7001f4c42a4ff9ba9168811a/lib/Hash.js#L116) that this function would need to be well-defined.

---

### (5) Are instances of a `HashBag` carried over? 
When looping through the `do while` of `hashBNodes(.)`, are the `HashBags` supposed to be carried over to allow for truly commutative and associatative hashes? (I do so.)
Or is a new `HashBag` created for each iteration? (iherman does so.)  

If we carry over `HashBags` between iterations:
When repeatedly invoking `hashBNodes(.)` from `distinguish(.)`, are `HashBags` provided on init with an existing HashTable? (I do not. Neither does iherman.)
Technically, they do not have to be carried over at all (I think) but it is just not specified if that should be happening or not (to allow for truly commutative and associatative hashes) .

--- 

### (6) Ordering of Graphs
What is the ordering of graphs? What is the defining property? Or in other words, what should my function `isLowerOrderThan(.)` check?

---

### (7) Dataset Support
The semantic to apply to RDF datasets would needed to be decided (at least to some extent, I think).
For more details see [W3C Working Group Note 25 February 2014](https://www.w3.org/TR/rdf11-datasets/) by Antoine Zimmermann.
For example, it needs to be decided if blank nodes are scoped to a named graph or not. 
According to the [W3C Recommendation 25 February 2014](https://www.w3.org/TR/rdf11-concepts/#section-dataset), blank nodes __can__ be shared across graphs within a dataset.  
Personally, I am not too happy with this ambiguity. B
ut an implementation could also allow for different kinds of dataset semantics to be applied with the algorithm.

---

### (8) RDF-star Support

"RDF-star extends RDF with a convenient way to make statements about other statements" (from the [Draft Community Group Report 07 January 2022](https://w3c.github.io/rdf-star/cg-spec/editors_draft.html)) .
As one possible use-case for this algorithm is the calculation of a message digest and (potentially) a subsquent digital signature, it may be necessary to specify the triples processed to derive the calculated hash (or signature). 
RDF-star provides one possible way of doing so, __without asserting said triples__. 
I'd argue that it is not up to a hash or signature to assert the truth-value of triples processed. 
So, I think that general support for RDF-star would be beneficial.
And other use-cases for this algorithm on RDF-star may exist, e.g. versioning of publication meta-data.