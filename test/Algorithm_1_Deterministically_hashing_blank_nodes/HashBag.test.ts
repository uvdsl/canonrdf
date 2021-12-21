import HashBag from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashBag';
import { hashString } from "../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";
import { expect } from 'chai';

describe('HashBag', () => {
    it('add()', () => {
        const input = ['y', 'x'];
        const current = new HashBag(input);
        current.add('z');
        const target = ['y', 'x', 'z']
        expect(input).to.deep.equal(target)
    });
    it('value()', () => {
        const input = ['1E','1E','153B', 'B9', '1F'];
        const sortedjoin = '1E1E1FB9153B'
        const current = new HashBag(input);
        const target = hashString(sortedjoin);
        expect(current.value()).to.equal(target);
    });

});