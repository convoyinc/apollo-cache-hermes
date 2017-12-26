import gql from 'graphql-tag';

import { selectionSetIsStatic } from '../../../../src';

describe(`ast.selectionSetIsStatic`, () => {

  function selection(source: string) {
    return gql(source).definitions[0].selectionSet;
  }

  it(`considers truly static fragments as static`, () => {
    expect(selectionSetIsStatic(selection(`
      fragment foo on Foo {
        one
        two {
          three
          four
        }
      }
    `))).to.eq(true);
  });

  it(`considers truly static operations as static`, () => {
    expect(selectionSetIsStatic(selection(`{
      one
      two {
        three
        four
      }
    }`))).to.eq(true);
  });

  it(`considers aliases as dynamic`, () => {
    expect(selectionSetIsStatic(selection(`{
      one: two
    }`))).to.eq(false);
  });

  it(`considers parameterized fields as dynamic`, () => {
    expect(selectionSetIsStatic(selection(`{
      one(foo: 123)
    }`))).to.eq(false);
  });

  it(`honors @static when on aliased fields`, () => {
    expect(selectionSetIsStatic(selection(`{
      one: two @static
    }`))).to.eq(true);
  });

  it(`honors @static when on parameterized fields`, () => {
    expect(selectionSetIsStatic(selection(`{
      one(foo: 123) @static
    }`))).to.eq(true);
  });

  it(`honors @static on nested fields`, () => {
    expect(selectionSetIsStatic(selection(`{
      one {
        two {
          three: foo @static
          four(bar: 123) @static
          five: baz(fizz: 321) @static
        }
      }
    }`))).to.eq(true);
  });

  describe(`selections with fragment spreads`, () => {

    const mainSelection = selection(`{
      foo { ...Foo }
    }`);

    it(`supports fragment walking`, () => {
      const fragmentGetter = jest.fn((name: string) => {
        expect(name).to.eq('Foo');
        return selection(`{
          one: foo
          two(bar: 123)
        }`);
      });

      expect(selectionSetIsStatic(mainSelection, fragmentGetter)).to.eq(false);

      expect(fragmentGetter.mock.calls).to.deep.eq([
        ['Foo'],
      ]);
    });

    it(`throws for missing fragments`, () => {
      function fragmentGetter() {
        return undefined;
      }

      expect(() => {
        selectionSetIsStatic(mainSelection, fragmentGetter);
      }).to.throw(/fragment.*Foo/);
    });

    it(`throws if you forget fragmentGetter`, () => {
      expect(() => {
        selectionSetIsStatic(mainSelection);
      }).to.throw(/fragmentGetter/);
    });
  });

});
