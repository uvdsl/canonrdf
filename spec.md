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
