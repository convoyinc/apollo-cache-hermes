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
    `))).toBe(true);
  });

  it(`considers truly static operations as static`, () => {
    expect(selectionSetIsStatic(selection(`{
      one
      two {
        three
        four
      }
    }`))).toBe(true);
  });

  it(`considers aliases as dynamic`, () => {
    expect(selectionSetIsStatic(selection(`{
      one: two
    }`))).toBe(false);
  });

  it(`considers parameterized fields as dynamic`, () => {
    expect(selectionSetIsStatic(selection(`{
      one(foo: 123)
    }`))).toBe(false);
  });

  it(`honors @static when on aliased fields`, () => {
    expect(selectionSetIsStatic(selection(`{
      one: two @static
    }`))).toBe(true);
  });

  it(`honors @static when on parameterized fields`, () => {
    expect(selectionSetIsStatic(selection(`{
      one(foo: 123) @static
    }`))).toBe(true);
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
    }`))).toBe(true);
  });

  it(`walks inline fragments`, () => {
    expect(selectionSetIsStatic(selection(`{
      one {
        ... on Foo {
          three: foo
        }
      }
    }`))).toBe(false);
  });

  describe(`selections with fragment spreads`, () => {

    const mainSelection = selection(`{
      foo { ...Foo }
    }`);

    it(`supports fragment walking`, () => {
      const fragmentGetter = jest.fn(() => {
        return selection(`{
          one: foo
          two(bar: 123)
        }`);
      });

      expect(selectionSetIsStatic(mainSelection, fragmentGetter)).toBe(false);
      expect(fragmentGetter.mock.calls).toEqual([
        ['Foo'],
      ]);
    });

    it(`throws for missing fragments`, () => {
      function fragmentGetter() {
        return undefined;
      }

      expect(() => {
        selectionSetIsStatic(mainSelection, fragmentGetter);
      }).toThrow(/fragment.*Foo/);
    });

    it(`throws if you forget fragmentGetter`, () => {
      expect(() => {
        selectionSetIsStatic(mainSelection);
      }).toThrow(/fragmentGetter/);
    });

    it(`walks inline fragments that contain the spread`, () => {
      const fragmentGetter = jest.fn(() => selection(`{ one: foo }`));
      expect(selectionSetIsStatic(selection(`{
        one {
          ... on Foo {
            ...Foo
          }
        }
      }`), fragmentGetter)).toBe(false);
    });

  });

});
