# graphql-express

GraphQL Server using NodeJS, ExpressJS and AWS DynamoDB for storage


For querying movies, supports operations such as 
```
{
movies(id: #) {
    movie_id INT (required)
    title String (required)
    description String (optional)
    release_date String (optional)
    popularity Float (optional)
    rating Float (optional)
 }
```
This gives you a specific movie by id.

For all movies in the database, do 
```
{
  movies {
     movie_id
     title
   }
}
```
