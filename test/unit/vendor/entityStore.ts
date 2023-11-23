// noinspection GraphQLUnresolvedReference

import gql from 'graphql-tag';
import { MissingFieldError, Reference } from '@apollo/client';

import { Hermes } from '../../../src';

const expect = jestExpect;

describe('EntityStore', () => {
  it('supports toReference(obj, true) to persist obj', () => {
    const cache = new Hermes({
      typePolicies: {
        Query: {
          fields: {
            book(_, { args, toReference, readField }) {
              const ref = toReference(
                {
                  __typename: 'Book',
                  isbn: args!.isbn,
                },
                true
              ) as Reference;

              expect(readField('__typename', ref)).toEqual('Book');
              const isbn = readField<string>('isbn', ref);
              expect(isbn).toEqual(args!.isbn);
              expect(readField('title', ref)).toEqual(titlesByISBN.get(isbn!));

              return ref;
            },

            books: {
              merge(
                existing: Reference[] = [],
                incoming: any[],
                { isReference, toReference, readField }
              ) {
                incoming.forEach((book) => {
                  expect(isReference(book)).toBe(false);
                  expect(book.__typename).toBeUndefined();
                });

                const refs = incoming.map(
                  book =>
                    toReference(
                      {
                        __typename: 'Book',
                        title: titlesByISBN.get(book.isbn),
                        ...book,
                      },
                      true
                    ) as Reference
                );

                refs.forEach((ref, i) => {
                  expect(isReference(ref)).toBe(true);
                  expect(readField('__typename', ref)).toBe('Book');
                  const isbn = readField<string>('isbn', ref);
                  expect(typeof isbn).toBe('string');
                  expect(isbn).toBe(readField('isbn', incoming[i]));
                });

                return [...existing, ...refs];
              },
            },
          },
        },

        Book: {
          keyFields: ['isbn'],
        },
      },
    });

    const booksQuery = gql`
      query {
        books {
          isbn
        }
      }
    `;

    const bookQuery = gql`
      query {
        book(isbn: $isbn) {
          isbn
          title
        }
      }
    `;

    const titlesByISBN = new Map<string, string>([
      ['9781451673319', 'Fahrenheit 451'],
      ['1603589082', 'Eager'],
      ['1760641790', 'How To Do Nothing'],
    ]);

    cache.writeQuery({
      query: booksQuery,
      data: {
        books: [
          {
            // Note: intentionally omitting __typename:"Book" here.
            isbn: '9781451673319',
          },
          {
            isbn: '1603589082',
          },
        ],
      },
    });

    const twoBookSnapshot = {
      'Book:{"isbn":"1603589082"}': {
        data: {
          __typename: 'Book',
          isbn: '1603589082',
          title: 'Eager',
        },
        inbound: [
          {
            id: 'ROOT_QUERY',
            path: [
              'books',
              1,
            ],
          },
        ],
        type: 0,
      },
      'Book:{"isbn":"9781451673319"}': {
        data: {
          __typename: 'Book',
          isbn: '9781451673319',
          title: 'Fahrenheit 451',
        },
        inbound: [
          {
            id: 'ROOT_QUERY',
            path: [
              'books',
              0,
            ],
          },
        ],
        type: 0,
      },
      ROOT_QUERY: {
        data: {
          books: [
            undefined,
            undefined,
          ],
        },
        outbound: [
          {
            id: 'Book:{"isbn":"9781451673319"}',
            path: [
              'books',
              0,
            ],
          },
          {
            id: 'Book:{"isbn":"1603589082"}',
            path: [
              'books',
              1,
            ],
          },
        ],
        type: 0,
      },
    };

    // Check that the __typenames were appropriately added.
    expect(cache.extract()).toEqual(twoBookSnapshot);

    cache.writeQuery({
      query: booksQuery,
      data: {
        books: [
          {
            isbn: '1760641790',
          },
        ],
      },
    });

    const threeBookSnapshot = {
      ...twoBookSnapshot,
      ROOT_QUERY: {
        ...twoBookSnapshot.ROOT_QUERY,
        data: {
          ...twoBookSnapshot.ROOT_QUERY.data,
          books: [
            ...twoBookSnapshot.ROOT_QUERY.data.books,
            undefined,
          ],
        },
        outbound: [...twoBookSnapshot.ROOT_QUERY.outbound,
          {
            id: 'Book:{"isbn":"1760641790"}',
            path: [
              'books',
              2,
            ],
          }],
      },
      'Book:{"isbn":"1760641790"}': {
        data: {
          __typename: 'Book',
          isbn: '1760641790',
          title: 'How To Do Nothing',
        },
        inbound: [
          {
            id: 'ROOT_QUERY',
            path: [
              'books',
              2,
            ],
          },
        ],
        type: 0,
      },
    };

    expect(cache.extract()).toEqual(threeBookSnapshot);

    const howToDoNothingResult = cache.readQuery({
      query: bookQuery,
      variables: {
        isbn: '1760641790',
      },
    });

    expect(howToDoNothingResult).toMatchObject({
      book: {
        __typename: 'Book',
        isbn: '1760641790',
        title: 'How To Do Nothing',
      },
    });

    // Check that reading the query didn't change anything.
    expect(cache.extract()).toEqual(threeBookSnapshot);

    const f451Result = cache.readQuery({
      query: bookQuery,
      variables: {
        isbn: '9781451673319',
      },
    });

    expect(f451Result).toMatchObject({
      book: {
        __typename: 'Book',
        isbn: '9781451673319',
        title: 'Fahrenheit 451',
      },
    });

    const cuckoosCallingDiffResult = cache.diff({
      query: bookQuery,
      optimistic: true,
      variables: {
        isbn: '031648637X',
      },
    });

    expect(cuckoosCallingDiffResult).toMatchObject({
      complete: false,
      result: {
        book: {
          __typename: 'Book',
          isbn: '031648637X',
        },
      },
      missing: [
        new MissingFieldError(
          'Can\'t find field \'title\' on Book:{"isbn":"031648637X"} object',
          {
            book: {
              title:
                'Can\'t find field \'title\' on Book:{"isbn":"031648637X"} object',
            },
          },
          expect.anything(), // query
          expect.anything() // variables
        ),
      ],
    });

    expect(cache.extract()).toEqual({
      ...threeBookSnapshot,
      // This book was added as a side effect of the read function.
      'Book:{"isbn":"031648637X"}': {
        data: {
          __typename: 'Book',
          isbn: '031648637X',
        },
        type: 0,
      },
    });

    const cuckoosCallingId = cache.identify({
      __typename: 'Book',
      isbn: '031648637X',
    })!;

    expect(cuckoosCallingId).toBe('Book:{"isbn":"031648637X"}');

    cache.writeQuery({
      id: cuckoosCallingId,
      query: gql`
        {
          title
        }
      `,
      data: {
        title: 'The Cuckoo\'s Calling',
      },
    });

    expect(cache.extract()).toEqual({
      ...threeBookSnapshot,
      // This book was added as a side effect of the read function.
      'Book:{"isbn":"031648637X"}': {
        data: {
          __typename: 'Book',
          isbn: '031648637X',
          title: 'The Cuckoo\'s Calling',
        },
        type: 0,
      },
    });

    cache.modify({
      id: cuckoosCallingId,
      fields: {
        title(title: string, { isReference, toReference, readField }) {
          const book = {
            __typename: 'Book',
            isbn: readField('isbn'),
            author: 'J.K. Rowling',
          };

          // By not passing true as the second argument to toReference, we
          // get back a Reference object, but the book.author field is not
          // persisted into the store.
          const refWithoutAuthor = toReference(book);
          expect(isReference(refWithoutAuthor)).toBe(true);
          expect(
            readField('author', refWithoutAuthor as Reference)
          ).toBeUndefined();

          // Update this very Book entity before we modify its title.
          // Passing true for the second argument causes the extra
          // book.author field to be persisted into the store.
          const ref = toReference(book, true);
          expect(isReference(ref)).toBe(true);
          expect(readField('author', ref as Reference)).toBe('J.K. Rowling');

          // In fact, readField doesn't need the ref if we're reading from
          // the same entity that we're modifying.
          expect(readField('author')).toBe('J.K. Rowling');

          // Typography matters!
          return title.split('\'').join('’');
        },
      },
    });

    expect(cache.extract()).toEqual({
      ...threeBookSnapshot,
      // This book was added as a side effect of the read function.
      'Book:{"isbn":"031648637X"}': {
        data: {
          __typename: 'Book',
          isbn: '031648637X',
          title: 'The Cuckoo’s Calling',
          author: 'J.K. Rowling',
        },
        type: 0,
      },
    });
  });

});
