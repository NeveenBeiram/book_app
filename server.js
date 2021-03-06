'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 3000;
const server = express();

server.use(express.static('./public'));
server.set('view engine','ejs');

server.use(express.urlencoded({extended:true}));

server.use(methodOverride('_method'));

// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client( {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized : false
  }
});




server.get('/',(req,res)=>{
  let SQL=`SELECT * FROM bookshelf ;`;
  client.query(SQL)
    .then (bookAppData=>{
      let bookCount = bookAppData.rows.length;
      // console.log(bookAppData.rows);
      // res.send(bookAppData.rows);

      res.render('pages/index',{books:bookAppData.rows,count:bookCount});
    })
    .catch(error=>{
      // res.send(error);
      // res.render('pages/index');
      res.render('pages/searches/error', { errors: error });
    });

});


//just for test, proof of life
server.get('/hello',(req,res)=>{
  res.render('pages/index');
});

server.get('/searches/new',(req,res)=>{
  res.render('pages/searches/new');
});

server.post('/searches', (req,res)=>{

  let searchTerm = req.body.book;
  let choice=req.body.choice;
  let bookAuthorURL=`https://www.googleapis.com/books/v1/volumes?q=${choice}:${searchTerm}`;
  // console.log(req.body);
  // if (req.body.title === 'on')
  // {
  //   bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTerm}`;
  // } else if (req.body.author === 'on')
  // {
  //   bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${searchTerm}`;
  // }
  superagent.get(bookAuthorURL)
    .then(fullBookData => {
      let bookData = fullBookData.body.items;
      // console.log(bookData);
      let bookObjArr = bookData.map(item => {
        return new Book (item); });
      //   res.send(bookObjArr);// for testing
      res.render('pages/searches/show',{renderBookData:bookObjArr} );
    })
    .catch(() => {
      // console.log('Error in getting data from Google Books API');
      // console.error(error);
      res.render('pages/searches/error', { errors: searchTerm });
    });
});

server.get('/books/:id',(req,res)=>{
// console.log('params');
// console.log(req.params);
  let SQL=`SELECT * FROM bookshelf WHERE id=$1;`;
  let safeValues=[req.params.id];
  client.query(SQL,safeValues)
    .then(results=>{
      // console.log(results.rows);
      // res.send(results.rows[0]);
      res.render('pages/books/detail',{detail:results.rows[0]});
    });

});
server.delete('/deleteBook/:id',(req,res)=>{
  let SQL = `DELETE FROM bookshelf WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value)
    .then(res.redirect('/'));
});

server.put('/updateBook/:id',(req,res)=>{
  let {author,title,isbn,image_url,description} = req.body;
  let SQL = `UPDATE bookshelf SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5 WHERE id=$6;`;
  let safeValues = [author,title,isbn,image_url,description,req.params.id];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/books/${req.params.id}`);
    });
});



server.post('/books',(req,res)=>{
// console.log(req.body);
  let {author,title,isbn,image_url,description}=req.body;
  let SQL=`INSERT INTO bookshelf (author,title,isbn,image_url,description)VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
  let safeValues=[author,title,isbn,image_url,description];
  client.query(SQL,safeValues)
    .then(results =>{
      // console.log(results.rows);
      // res.send(results.rows);
      res.redirect(`/books/${results.rows[0].id}`);
    });
});

// server.post('/searches',(req,res)=>{
//   console.log(req.body);
//   let title=req.body.title;
//   let search=req.body.search;
//   let URL =`https://www.googleapis.com/books/v1/volumes?q=${search}:${title}`;
//   superagent.get(URL)
//     .then(fullBookData => {
//       let bookData = fullBookData.body.items;
//       console.log(bookData);
//       let bookObjArr = bookData.map(item => {
//         return new Book (item); });
//       res.send(bookObjArr);// for testing
//       // res.render('pages/searches/show',{renderBookData:bookObjArr} );
//     });
// //   superagent.get(URL)
// //     .then(booksData=>{
// //     // console.log(booksData);
// //     //   booksData.forEach(val=>{
// //       let data=booksData.body.items;
// //       let bookdata=data.map(item=>{
// //         return new Book(item);
// //       });
// //       res.send(bookdata);
//   //    res.render('searches/show',{booksArr:book});
//   //   });
//   //   console.log(bookdata);
//   // });
// //     .catch(){
// // console.log('');
// //     }
// });


// function Book (data){
//   this.title=data.volumeInfo.title;
//   this.authors=data.volumeInfo.authors;
//   this.description=data.volumeInfo.description ? data.items.volumeInfo.description : `no description `;
//   this.imageLinks=data.volumeInfo.imageLinks ? data.items.volumeInfo.imageLinks : `https://i.imgur.com/J5LVHEL.jpg`;

// }

function Book (oneBook)
{
  this.title = oneBook.volumeInfo.title ? oneBook.volumeInfo.title : 'Unkonown Title',
  this.author = oneBook.volumeInfo.authors? oneBook.volumeInfo.authors : 'Unkonown Author', // array
  this.description = oneBook.volumeInfo.description ? oneBook.volumeInfo.description : 'No description available' ,
  this.imgUrl = oneBook.volumeInfo.imageLinks? oneBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
  let reg = /ISBN/g;
  this.isbn= reg.test(oneBook.volumeInfo.industryIdentifiers[0].type)? oneBook.volumeInfo.industryIdentifiers[0].identifier : 'No isbn';

}

server.get('*',(req,res)=>{
  res.send('Error');
});

// server.listen(PORT,()=>{
//   console.log(`Listening on PORT ${PORT}`);
// });

client.connect()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on ${PORT}`));

  }).catch(error=>{
    console.log(error);
  });
