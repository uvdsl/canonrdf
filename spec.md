# Open Questions for Specification
_Note_:  
iherman's [implementation](https://github.com/iherman/canonical_rdf) of `hashBNodes(.)` and my implementation of that function are equivalent (to my testing). However, we interpret the ordering of graphs differently (here: `isLowerOrderThan(.)`).  
The original [implementation]() in Java by aidhog is not equivalent to any of the aforementioned implementations (afaik), as the underlying RDF libraries handle the values of terms differently (see question 3).

---
### (1) Which hashing algorithm is chosen? ("a perfect one")
```js
const HASH_ALGO = 'md5';
```

---

### (2) What is the exact value of the constants?
```js
const INITIAL_BN_HASH = Buffer.alloc(16); 
const EDGE_OUT = Buffer.from('+'); 
const EDGE_IN = Buffer.from('-'); 
const MARKER = Buffer.from('@'); 
```

---

### (3) How exactly are terms handled for hashing?  
Does the string value of a __URI__ include the starting and closing brackets `< ... >` or is it only the inner value that is used for hashing? For example, [N3.js](https://github.com/rdfjs/N3.js) excludes the brackets, whereas [nxparser](https://github.com/nxparser/nxparser) (Java) includes the brackets.  
```js
const uri = (decide) ? '<http://example.org>' : 'http://example.org';
```
Similarly, for the string value of __Blank Nodes__, are the starting `_:` included?  
```js
const bn  = (decide) ? '_:bn' : 'bn';
```
And for __Literals__, [nxparser](https://github.com/nxparser/nxparser) (Java) always includes the (inferred) datatype in the value of the term, whereas [N3.js](https://github.com/rdfjs/N3.js) does so only if the datatype was provided.
```js
const l_0 = (decide) ? '"test"^^xsd:string' : '"test"';
const l_1 = (decide) ? '"0"^^xsd:integer' : '0';
```
There may be other differences between implementations that I am not aware of.

---

### (4) How exaclty is a `hashTuple` defined? (concatenation of inputs?)
```js
const hashTuple = (...data: Buffer[]) => {
    return hash(Buffer.concat(data));
}
```

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