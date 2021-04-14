'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const server = express();

server.use(express.static('./public'));
server.set('view engine','ejs');

server.use(express.urlencoded({extended:true}));

const client = new pg.Client(process.env.DATABASE_URL);




server.get('/',(req,res)=>{
  let SQL=`SELECT * FROM bookshelf ;`;
  client.query(SQL)
    .then (bookAppData=>{
      console.log(bookAppData.rows);
      // res.send(bookAppData.rows);
      res.render('pages/index',{books:bookAppData.rows});
    })
    .catch(error=>{
      res.send(error);
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
  let bookAuthorURL;
  // console.log(req.body);
  if (req.body.title === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=intitle:${searchTerm}`;
  } else if (req.body.author === 'on')
  {
    bookAuthorURL = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${searchTerm}`;
  }
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



server.post('/books',(req,res)=>{
// console.log(req.body);
  let {auther,title,isbn,image_url,description}=req.body;
  let SQL=`INSERT INTO bookshelf (author,title,isbn,image_url,description)VALUES ($1,$2,$3,$4,$5) RETURNING *;`;
  let safeValues=[auther,title,isbn,image_url,description];
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
  this.title = oneBook.volumeInfo.title ? oneBook.volumeInfo.title : 'Unkonown',
  this.authors = oneBook.volumeInfo.authors? oneBook.volumeInfo.authors : 'Unkonown', // array
  this.description = oneBook.volumeInfo.description ? oneBook.volumeInfo.description : 'Unkonown' ,
  this.imgUrl = oneBook.volumeInfo.imageLinks? oneBook.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
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
