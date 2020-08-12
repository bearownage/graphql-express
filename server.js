const express = require('express')
const expressGraphQL = require('express-graphql')
var AWS = require("aws-sdk");

var conf = require('./conf');

AWS.config.update({
    region: "us-east-2",
    accessKeyId: conf.aws_key,
    secretAccessKey: conf.aws_secret_key    
  });

var docClient = new AWS.DynamoDB.DocumentClient();


const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull
} = require('graphql');
const { ServerlessApplicationRepository } = require('aws-sdk');

const app = express()

var table = "films";

const authors = [
    { id: 1, name: 'J.K Rowling'},
    { id: 2, name: 'J. R. R. Tolkien'},
    { id: 3, name: 'Brent Weeks'}
]

const books = [
    { id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1},
    { id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1},
    { id: 3, name: 'Harry Potter and the Goblet of fire', authorId: 1},
    { id: 4, name: 'The Fellowship of the Ring', authorId: 2},
    { id: 5, name: 'The Two Towers', authorId: 2},
    { id: 6, name: 'The Return of the King', authorId: 2},
    { id: 7, name: 'The Way of Shadows', authorId: 3 },
    { id: 8, name: 'Beyond the Shadows', authorId: 3}
]

const MovieType = new GraphQLObjectType({
    name: 'Movie',
    description: 'This represents a movie',
    fields: () => ({
        movie_id : { type: GraphQLNonNull(GraphQLInt)},
        popularity: { type: GraphQLNonNull(GraphQLInt)},
        title: { type: GraphQLNonNull(GraphQLString)},
        description : { type: GraphQLNonNull(GraphQLString)},
        rating: { type: GraphQLNonNull(GraphQLInt)},
        release_date : { type: GraphQLNonNull(GraphQLString)}
    })
})

const AuthorType = new GraphQLObjectType({
    name: 'Author',
    description: 'This represents an author of a book',
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString)},
        books: { 
            type: new GraphQLList(BookType), 
            resolve: (author) => {
                return books.filter(book => book.authorId === author.id)
            }
        }
    })
})


const BookType = new GraphQLObjectType({
    name: 'Book',
    description: 'This represents a book written by author',
    // We use a function type so that things get defined before they are called
    fields: () => ({
        id: { type: GraphQLNonNull(GraphQLInt) },
        name: { type: GraphQLNonNull(GraphQLString)},
        authorId: { type: GraphQLNonNull(GraphQLInt) },
        author: { 
            type: AuthorType,
            resolve: (book) => {
                return authors.find(author => author.id == book.authorId )
            } 
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
        book: {
            type: BookType,
            description: 'A single book',
            args: {
                id: { type: GraphQLInt }
            },
            //Query databse here
            resolve: (parent, args) => books.find(book => book.id === args.id)
        },
        books: {
            type: new GraphQLList(BookType),
            description: 'List of All books',
            //Query databse here
            resolve: () =>  {
                console.log(books)
                return books
            }
        },
        authors: {
            type: new GraphQLList(AuthorType),
            description: 'List of All Authors',
            //Query databse here
            resolve: () => authors
        },
        author: {
            type: AuthorType,
            description: 'A single author',
            args: {
                id: { type: GraphQLInt }
            },
            //Query databse here
            resolve: (parent, args) => authors.find(author => author.id === args.id)
        },
        movie: {
            type: MovieType,
            description: 'A single movie',
            args: {
                id: { type: GraphQLInt }
            },
            resolve : (parent, args) => {
                var params = {
                    TableName: table,
                    Key:{
                        "movie_id": args.id
                    }
                };
                var second = {};
                const result = async (params, fn) => {
                        const response = await docClient.get(params, function(err, data) {
                            if (err) {
                                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                                return null;
                            } else {
                                //console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                                //console.log(data.Item);
                                fn(data.Item);
                            }
                    });
                    return response;
                }


                (async () => {
                    await result(params, function(data) {
                        console.log(data);
                        //second = data;
                        return data;
                    });
                })()               

            }
        }
            
        
    })
})

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: () => ({
        addBook: {
            type: BookType,
            description: 'Add a book',
            args : {
                name: {
                    type: GraphQLNonNull(GraphQLString) 
                },
                authorId: {
                    type: GraphQLNonNull(GraphQLInt) 
                }
            },
            resolve: (parent, args) => {
                const book = { id: books.length +1, name: args.name, authorId: args.authorId }
                books.push(book)
                return book
            }
        },
        addAuthor: {
            type: AuthorType,
            description: 'Add an Author',
            args : {
                name: {
                    type: GraphQLNonNull(GraphQLString) 
                }
            },
            resolve: (parent, args) => {
                const author = { id: authors.length +1, name: args.name }
                authors.push(author)
                return author   
            }
        },
        addMovie: {
            type: MovieType,
            description: 'Add a movie',
            args : {
                title: {
                    type: GraphQLNonNull(GraphQLString)
                },
                year: {
                    type: GraphQLNonNull(GraphQLString)
                },
                description: {
                    type: GraphQLNonNull(GraphQLString)
                }
            },
            resolve: (parent, args) => {
                var params = {
                    TableName: "films",
                    Item: {
                        "year":  args.year,
                        "title": args.title,
                        "description":  args.info
                    }
                };
            
                docClient.put(params, function(err, data) {
                   if (err) {
                       console.error("Unable to add movie", args.title, ". Error JSON:", JSON.stringify(err, null, 2));
                   } else {
                       console.log("PutItem succeeded:", args.title);
                   }
                });   
            }

        }
    })
})
const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})


app.use('/graphql', expressGraphQL.graphqlHTTP({
    schema : schema,
    graphiql: true,
}))
app.listen(5000., () => console.log('Server Running'))