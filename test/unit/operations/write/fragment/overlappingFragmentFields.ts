import { GraphSnapshot } from '../../../../../src/GraphSnapshot';
import { createSnapshot } from '../../../../helpers';

describe(`overlapping fragments`, () => {
  let snapshot: GraphSnapshot;
  beforeAll(() => {
    const cyclicRefQuery = `
      query {
        myDetailedBar {
          ...DetailedBarFragment
        }
        myFooOrBar {
          # FooFragment defines 'payload' but BarFragment doesn't,
          # despite 'payload' being a valid field on Bar.
          ...FooFragment
          ...BarFragment
        }
      }

      fragment FooFragment on Foo {
        id
        payload
      }

      fragment BarFragment on Bar {
        id
        fizz
      }

      fragment DetailedBarFragment on Bar {
        ...BarFragment
        payload
      }
    `;

    const result = createSnapshot(
      {
        myDetailedBar: {
          id: 'Bar:1',
          fizz: 'buzz',
          payload: 'huge',
        },
        myFooOrBar: {
          id: 'Bar:1',
          fizz: 'buzz',
        },
      },
      cyclicRefQuery
    );

    snapshot = result.snapshot;
  });

  it.skip(`writing an entity with overlapping fragment fields should not lose data`, () => {
    const bar = snapshot.getNodeData('Bar:1');

    expect(bar.id).toBe('Bar:1');
    expect(bar.fizz).toBe('buzz');

    // If this assertion fails, the representation of `Bar:1` in the
    // `myFooOrBar` field is causing its `payload` field to be nullified
    // because `payload` is in the potential selection set, but only for the
    // `Foo` type.
    expect(bar.payload).toBe('huge');
  });
});
