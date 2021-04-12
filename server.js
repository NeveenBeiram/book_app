'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const PORT = process.env.PORT || 3000;
const server = express();
server.set('view engine','ejs');
server.use(express.static('./public'));

server.use(express.urlencoded({extended:true}));

server.get('/',(req,res)=>{
  res.render('pages/index');
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
      console.log(bookData);
      let bookObjArr = bookData.map(item => {
        return new Book (item); });
      //   res.send(bookObjArr);// for testing
      res.render('pages/searches/show',{renderBookData:bookObjArr} );
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

server.listen(PORT,()=>{
  console.log(`Listening on PORT ${PORT}`);
});
