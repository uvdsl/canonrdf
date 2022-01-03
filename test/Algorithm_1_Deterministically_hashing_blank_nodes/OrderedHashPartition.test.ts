import OrderedHashPartition from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/OrderedHashPartition';
import { expect } from 'chai';

describe('OrderedHashPartition', () => {
    it('orders by size of partitions', () => {
        const input = {
            '-3': Buffer.from('0c', 'hex'),
            '-2': Buffer.from('0c', 'hex'),
            '-1': Buffer.from('0c', 'hex'),
            '0': Buffer.from('0a', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const current = new OrderedHashPartition(input);
        const target_map = {
            '0a': ['0', '2'],
            '0b': ['1'],
            '0c': ['-3', '-2', '-1']
        }
        const target = { _b_id_to_hash: input, _hash_to_b_ids: target_map, _ordering: [Buffer.from('0b', 'hex'), Buffer.from('0a', 'hex'), Buffer.from('0c', 'hex')] }
        expect(current).to.deep.equal(target)
    });
    it('orders with hash as tie breaker', () => {
        const input = {
            '-1': Buffer.from('0d', 'hex'),
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('aaaa', 'hex'),
            '2': Buffer.from('0b', 'hex')
        }
        const current = new OrderedHashPartition(input);
        const target_map = {
            '0d': ['-1'],
            '0b': ['2'],
            '0c': ['0'],
            'aaaa': ['1']
        }
        const target = { _b_id_to_hash: input, _hash_to_b_ids: target_map, _ordering: [Buffer.from('0b', 'hex'), Buffer.from('0c', 'hex'), Buffer.from('0d', 'hex'), Buffer.from('aaaa', 'hex')] }
        expect(current).to.deep.equal(target)
    });
    it('returns `true` for isFine()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('aaaa', 'hex'),
            '2': Buffer.from('0b', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.isFine()
        expect(current).to.be.true;
    });
    it('returns `false` for isFine()', () => {
        const input = {
            '0': Buffer.from('0a', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.isFine()
        expect(current).to.be.false;
    });
    it('returns theLowestNonTrivial()', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex'),
            '3': Buffer.from('0a', 'hex'),
            '4': Buffer.from('0b', 'hex')
        }
        const target = { lowestNonTrivialHash: Buffer.from('0a', 'hex'), lowestNonTrivialBNs: ['2', '3'] }
        const p = new OrderedHashPartition(input);
        const current = p.getLowestNonTrivial()
        expect(current).to.deep.equal(target)
    });
    it('returns undefined for theLowestNonTrivial() when fine', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const target = undefined
        const p = new OrderedHashPartition(input);
        const current = p.getLowestNonTrivial()
        expect(current).to.equal(target)
    });
    it('returns `true` for isStableComparedTo() when fine (condition i)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0b', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const q = new OrderedHashPartition({})
        const current = p.isStableComparedTo(q)
        expect(current).to.be.true;
    });
    it('returns `true` for isStableComparedTo() when unchanged (condition ii)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const q = new OrderedHashPartition(Object.assign({}, input))
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
        const p = new OrderedHashPartition(input1);
        const q = new OrderedHashPartition(input0);
        const current = p.isStableComparedTo(q)
        expect(current).to.be.false;
    });
    it('returns `true` for hasHashFor() when the input bn_ids share a common hash', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.hasHashFor(['1','2']) && p.hasHashFor(['0'])
        expect(current).to.be.true;
    })
    it('returns `false` for hasHashFor() when the input bn_ids do not share a common hash (check by length of array)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.hasHashFor(['1'])
        expect(current).to.be.false;
    });
    it('returns `false` for hasHashFor() when the input bn_ids do not share a common hash (check by values of array)', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.hasHashFor(['1', '0'])
        expect(current).to.be.false;
    });
    it('returns `false` for hasHashFor() when the input bn_ids is emtpy', () => {
        const input = {
            '0': Buffer.from('0c', 'hex'),
            '1': Buffer.from('0a', 'hex'),
            '2': Buffer.from('0a', 'hex')
        }
        const p = new OrderedHashPartition(input);
        const current = p.hasHashFor([])
        expect(current).to.be.false;
    });
    


});