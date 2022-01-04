import HashTable from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashTable';
import { expect } from 'chai';

describe('HashTable', () => {
    it('returns `true` for isFine() with emtpy table', () => {
        const input = {
        }
        const p = new HashTable(input);
        const current = p.isFine()
        expect(current).to.be.true;
    });
    it('returns `true` for isFine()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('aaaa', 'hex'),
            '2': Buffer.from('0b', 'hex')
        }
        const p = new HashTable(input);
        const current = p.isFine()
        expect(current).to.be.true;
    });
    it('returns `false` for isFine()', () => {
        const input = {
            '0': Buffer.from('0a', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.isFine()
        expect(current).to.be.false;
    });
    it('returns `true` for isStableComparedTo() when fine (condition i)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const q = new HashTable({})
        const current = p.isStableComparedTo(q)
        expect(current).to.be.true;
    });
    it('returns `true` for isStableComparedTo() when unchanged (condition ii)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const q = new HashTable(Object.assign({}, input))
        const current = p.isStableComparedTo(q)
        expect(current).to.be.true;
    });
    it('returns `false` for isStableComparedTo() when changed but not fine', () => {
        const input1 = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const input0 = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0c', 'hex')
        }
        const p = new HashTable(input1);
        const q = new HashTable(input0);
        const current = p.isStableComparedTo(q)
        expect(current).to.be.false;
    });
    it('returns `true` for hasHashFor() when the input bn_ids share a common hash', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.hasHashFor(['1', '2']) && p.hasHashFor(['0'])
        expect(current).to.be.true;
    })
    it('returns `false` for hasHashFor() when the input bn_ids do not share a common hash (check by length of array)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.hasHashFor(['1'])
        expect(current).to.be.false;
    });
    it('returns `false` for hasHashFor() when the input bn_ids do not share a common hash (check by values of array)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.hasHashFor(['1', '0'])
        expect(current).to.be.false;
    });
    it('returns `false` for hasHashFor() when the input bn_ids is emtpy', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.hasHashFor([])
        expect(current).to.be.false;
    });
    it('simply returns the mapping for getBIdToHashMapping()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.getBIdToHashMapping()
        expect(current).to.equal(input);
    })
    it('simply returns the mapping for getHashToBIdsMapping()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const target = {
            '0a': ['1', '2'],
            '0c': ['0'],
        }
        const p = new HashTable(input);
        const current = p.getHashToBIdsMapping()
        expect(current).to.deep.equal(target);
    })
    it('simply gets the hash of some bn_id for getHash()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const current = p.getHash('1')
        expect(current).to.deep.equal(Buffer.from('0a', 'hex'));
    })
    it('set the hash of some bn_id for setHash()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const newVal = Buffer.from('0c', 'hex')
        const p = new HashTable(input);
        p.setHash('1', newVal)
        expect(p.getHash('1')).to.equal(newVal)
    })
    it('update the hash of some bn_id for setHash(), adding to existing', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const newVal = Buffer.from('0c', 'hex')
        const p = new HashTable(input);
        p.setHash('1', newVal)
        expect(p.hasHashFor(['1', '0'])).to.be.true;
    })
    it('update the hash of some bn_id for setHash(), creating new', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const newVal = Buffer.from('0b', 'hex')
        const p = new HashTable(input);
        p.setHash('1', newVal)
        expect(p.hasHashFor(['1'])).to.be.true;
    })
    it('create a new hash table object for clone()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const q = p.clone()
        expect(q).to.not.equal(p)
    })
    it('create a different hash object for clone()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const q = p.clone()
        expect(q.getBIdToHashMapping()).to.not.equal(p.getBIdToHashMapping())
    })
    it('create a deep equal hash table object for clone()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new HashTable(input);
        const q = p.clone()
        expect(q).to.deep.equal(p)
    })

});