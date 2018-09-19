"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var apollo_utilities_1 = require("apollo-utilities");
var _ = require("lodash");
var context_1 = require("../../../../src/context");
var GraphSnapshot_1 = require("../../../../src/GraphSnapshot");
var read_1 = require("../../../../src/operations/read");
var SnapshotEditor_1 = require("../../../../src/operations/SnapshotEditor");
var write_1 = require("../../../../src/operations/write");
var schema_1 = require("../../../../src/schema");
var helpers_1 = require("../../../helpers");
var QueryRootId = schema_1.StaticNodeId.QueryRoot;
describe("context.CacheContext", function () {
    function queryWithTypename(gqlString, variables, rootId) {
        var rawOperation = helpers_1.query(gqlString, variables, rootId);
        return tslib_1.__assign({}, rawOperation, { document: apollo_utilities_1.addTypenameToDocument(rawOperation.document) });
    }
    describe("entity transformation", function () {
        describe("no entity transformer", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("\n          query getViewer($id:ID!) {\n            viewer(id:$id) {\n              id\n              name\n            }\n          }\n        ", { id: '4' });
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: undefined }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    viewer: {
                        __typename: 'viewer',
                        id: '4',
                        name: 'Bob',
                    },
                }).snapshot;
            });
            it("check helper methods does not exist", function () {
                var viewerParameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['viewer'], { id: '4' });
                expect(Object.getPrototypeOf(snapshot.getNodeData(viewerParameterizedId))).to.not.include.all.keys(['getName', 'getId']);
            });
        });
        describe("mixin additional helper on simple query", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("{\n          viewer {\n            id\n            name\n          }\n        }");
                function mixinHelperMethods(obj, proto) {
                    if (obj['__typename'] === 'viewer') {
                        var newPrototype = _.clone(Object.getPrototypeOf(obj));
                        Object.assign(newPrototype, proto);
                        Object.setPrototypeOf(obj, newPrototype);
                    }
                }
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: function (node) {
                        mixinHelperMethods(node, {
                            getName: function () {
                                return this.name;
                            },
                            getId: function () {
                                return this.id;
                            },
                        });
                    } }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    viewer: {
                        __typename: 'viewer',
                        id: '0',
                        name: 'Bob',
                    },
                }).snapshot;
            });
            it("get information through helper methods", function () {
                var result = read_1.read(entityTransformerContext, viewerQuery, snapshot).result;
                var name = result.viewer.getName();
                var id = result.viewer.getId();
                expect(name).to.eq('Bob');
                expect(id).to.eq('0');
            });
            it("check helper methods exists", function () {
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId']);
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId).viewer)).to.include.all.keys(['getName', 'getId']);
            });
        });
        describe("mixin additional helper on nested query", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("\n          query GetUser {\n            user {\n              dispatcher\n              id\n              nickName\n              name\n              contact {\n                address {\n                  city\n                  state\n                }\n                phone\n              }\n            }\n            driver {\n              id\n              name\n              shipments\n            }\n          }\n        ");
                function mixinHelperMethods(obj, proto) {
                    if (obj['__typename'] === 'user') {
                        var newPrototype = _.clone(Object.getPrototypeOf(obj));
                        Object.assign(newPrototype, proto);
                        Object.setPrototypeOf(obj, newPrototype);
                    }
                }
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: function (node) {
                        mixinHelperMethods(node, {
                            getName: function () {
                                return this.name;
                            },
                            getId: function () {
                                return this.id;
                            },
                            getContact: function () {
                                return this.contact;
                            },
                            getJustPhoneNumber: function () {
                                return this.contact.phone;
                            },
                            getCity: function () {
                                return this.contact.address.city;
                            },
                        });
                    } }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    user: {
                        __typename: 'user',
                        dispatcher: true,
                        id: '0',
                        name: 'Bob',
                        nickName: 'B',
                        contact: {
                            __typename: 'contact',
                            address: {
                                __typename: 'address',
                                city: 'AA',
                                state: 'AAAA',
                            },
                            phone: 1234,
                        },
                    },
                    driver: {
                        __typename: 'driver',
                        id: '1',
                        name: 'Bear',
                        shipments: [{ id: 0, name: 'portland' }],
                    },
                }).snapshot;
            });
            it("get information through helper methods", function () {
                var result = read_1.read(entityTransformerContext, viewerQuery, snapshot).result;
                expect(result.user.getName()).to.eq('Bob');
                expect(result.user.getId()).to.eq('0');
                expect(result.user.getJustPhoneNumber()).to.eq(1234);
                expect(result.user.getCity()).to.eq('AA');
            });
            it("check helper methods exists", function () {
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId).user)).to.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
            });
            it("check helper method not attached to other entity", function () {
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
                expect(Object.getPrototypeOf(snapshot.getNodeData('1'))).to.not.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
            });
        });
        describe("mixin additional helper on nested alias query", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("\n          query GetUser {\n            User: user {\n              dispatcher\n              id\n              nickName\n              name\n              contact {\n                address {\n                  city\n                  state\n                }\n                phone\n              }\n            }\n            Driver: driver {\n              id\n              name\n              shipments\n            }\n          }\n        ");
                function mixinHelperMethods(obj, proto) {
                    if (obj['__typename'] === 'user') {
                        var newPrototype = _.clone(Object.getPrototypeOf(obj));
                        Object.assign(newPrototype, proto);
                        Object.setPrototypeOf(obj, newPrototype);
                    }
                }
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: function (node) {
                        mixinHelperMethods(node, {
                            getName: function () {
                                return this.name;
                            },
                            getId: function () {
                                return this.id;
                            },
                            getContact: function () {
                                return this.contact;
                            },
                            getJustPhoneNumber: function () {
                                return this.contact.phone;
                            },
                            getCity: function () {
                                return this.contact.address.city;
                            },
                        });
                    } }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    User: {
                        __typename: 'user',
                        dispatcher: true,
                        id: '0',
                        name: 'Bob',
                        nickName: 'B',
                        contact: {
                            __typename: 'contact',
                            address: {
                                __typename: 'address',
                                city: 'AA',
                                state: 'AAAA',
                            },
                            phone: 1234,
                        },
                    },
                    Driver: {
                        __typename: 'driver',
                        id: '1',
                        name: 'Bear',
                        shipments: [{ id: 0, name: 'portland' }],
                    },
                }).snapshot;
            });
            it("get information through helper methods", function () {
                var result = read_1.read(entityTransformerContext, viewerQuery, snapshot).result;
                expect(result.user.getName()).to.eq('Bob');
                expect(result.user.getId()).to.eq('0');
                expect(result.user.getJustPhoneNumber()).to.eq(1234);
                expect(result.user.getCity()).to.eq('AA');
            });
            it("check helper methods exists", function () {
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId).user)).to.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
            });
            it("check helper method not attached to other entity", function () {
                expect(Object.getPrototypeOf(snapshot.getNodeData(QueryRootId))).to.not.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
                expect(Object.getPrototypeOf(snapshot.getNodeData('1'))).to.not.include.all.keys(['getName', 'getId', 'getJustPhoneNumber', 'getCity']);
            });
        });
        describe("freeze an object", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("{\n          viewer {\n            id\n            name\n          }\n        }");
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: function (node) {
                        Object.freeze(node);
                    } }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    viewer: {
                        __typename: 'viewer',
                        id: '0',
                        name: 'Bob',
                    },
                }).snapshot;
            });
            it("check that entity is frozen", function () {
                expect(snapshot.getNodeData(QueryRootId)).to.be.frozen;
                expect(snapshot.getNodeData('0')).to.be.frozen;
            });
        });
        describe("mixing additional helper on parameterized query", function () {
            var viewerQuery, entityTransformerContext, snapshot;
            beforeAll(function () {
                viewerQuery = queryWithTypename("\n        query getViewer($id:ID!) {\n          viewer(id:$id) {\n            id\n            name\n          }\n        }", { id: '4' });
                function mixinHelperMethods(obj, proto) {
                    if (obj['__typename'] === 'viewer') {
                        var newPrototype = _.clone(Object.getPrototypeOf(obj));
                        Object.assign(newPrototype, proto);
                        Object.setPrototypeOf(obj, newPrototype);
                    }
                }
                entityTransformerContext = new context_1.CacheContext(tslib_1.__assign({}, helpers_1.strictConfig, { entityTransformer: function (node) {
                        mixinHelperMethods(node, {
                            getName: function () {
                                return this.name;
                            },
                            getId: function () {
                                return this.id;
                            },
                        });
                    } }));
                var empty = new GraphSnapshot_1.GraphSnapshot();
                snapshot = write_1.write(entityTransformerContext, empty, viewerQuery, {
                    viewer: {
                        __typename: 'viewer',
                        name: 'Bob',
                        id: '4',
                    },
                }).snapshot;
            });
            it("get information through helper methods", function () {
                var result = read_1.read(entityTransformerContext, viewerQuery, snapshot).result;
                var name = result.viewer.getName();
                var id = result.viewer.getId();
                expect(name).to.eq('Bob');
                expect(id).to.eq('4');
            });
            it("check helper methods exists", function () {
                var viewerParameterizedId = SnapshotEditor_1.nodeIdForParameterizedValue(QueryRootId, ['viewer'], { id: '4' });
                expect(Object.getPrototypeOf(snapshot.getNodeData(viewerParameterizedId))).to.include.all.keys(['getName', 'getId']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW50aXR5VHJhbnNmb3JtYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnRpdHlUcmFuc2Zvcm1hdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxREFBeUQ7QUFDekQsMEJBQTRCO0FBRTVCLG1EQUF1RDtBQUN2RCwrREFBOEQ7QUFDOUQsd0RBQXVEO0FBQ3ZELDRFQUF3RjtBQUN4RiwwREFBeUQ7QUFFekQsaURBQTRFO0FBQzVFLDRDQUF1RDtBQUUvQyxJQUFBLDZDQUFzQixDQUFrQjtBQUVoRCxRQUFRLENBQUMsc0JBQXNCLEVBQUU7SUFFL0IsMkJBQTJCLFNBQWlCLEVBQUUsU0FBc0IsRUFBRSxNQUFlO1FBQ25GLElBQU0sWUFBWSxHQUFHLGVBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELE1BQU0sc0JBQU0sWUFBWSxJQUFFLFFBQVEsRUFBRSx3Q0FBcUIsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUc7SUFDckYsQ0FBQztJQUVELFFBQVEsQ0FBQyx1QkFBdUIsRUFBRTtRQUNoQyxRQUFRLENBQUMsdUJBQXVCLEVBQUU7WUFDaEMsSUFBSSxXQUF5QixFQUFFLHdCQUFzQyxFQUFFLFFBQXVCLENBQUM7WUFDL0YsU0FBUyxDQUFDO2dCQUNSLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxrSkFPL0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUVoQix3QkFBd0IsR0FBRyxJQUFJLHNCQUFZLHNCQUN0QyxzQkFBWSxJQUNmLGlCQUFpQixFQUFFLFNBQVMsSUFDNUIsQ0FBQztnQkFDSCxJQUFNLEtBQUssR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztnQkFDbEMsUUFBUSxHQUFHLGFBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFO29CQUM3RCxNQUFNLEVBQUU7d0JBQ04sVUFBVSxFQUFFLFFBQVE7d0JBQ3BCLEVB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