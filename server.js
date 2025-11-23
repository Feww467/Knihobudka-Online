import express from 'express';
import { PrismaClient } from '@prisma/client';
import { cons } from 'effect/List';
import { all } from 'proxy-addr';
import cors from 'cors';

const app = express();
const port = 3000;
const prisma = new PrismaClient();

// Allow specific origin
app.use(cors({
  origin: 'https://knihobudka-online-production.up.railway.app',
  credentials: true
}));

// Or allow all origins (less secure)
app.use(cors());
//Functions

function authorsSplit(authors) {
    const authorTypes = ['primary', 'secondary', 'tertiary', 'corporate'];
    for (const type of authorTypes) {
        if ((Object.keys(authors[type])).length > 0) {
            const authorString = Object.keys(authors[type])[0];
            return extractFirstLastName(authorString);
        };
    }
    return { firstName: 'Unknown', lastName: 'Unknown' };
}

function extractFirstLastName(authorString) {
  const nameWithoutYears = authorString.replace(/\s*,\s*\d{4}[-–]\d{0,4}.*$/, '');
  const parts = nameWithoutYears.split(',').map(part => part.trim());
  
  if (parts.length === 2) {
    return {
      surname: parts[1],
      name: parts[0]
    };
  } else {
    const nameParts = nameWithoutYears.trim().split(' ');
    if (nameParts.length >= 2) {
      const surname = nameParts.pop(); // Last part is last name
      const name = nameParts.join(' '); // Everything else is first name
      return {
        surname: surname,
        name: name,
      };
    } else {
      return {
        firstName: '',
        lastName: nameWithoutYears
      };
    }
  }
}
app.use(express.json());
app.use(express.static('public'));

app.get('/', (_req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.get('/api/books/isbn', async (req, res) => {
    const isbn = req.query.isbn;
    try {
        const response = await fetch(`https://www.knihovny.cz/api/v1/search?lookfor=isbn:${isbn}&field[]=authors&field[]=title&field[]=humanReadablePublicationDates&field[]=bibliographicLevel&field[]=physicalDescriptions&sort=relevance&limit=2`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            const book = data.records[0];
            book.surname = (authorsSplit(book.authors)).surname;
            book.name = (authorsSplit(book.authors)).name;
            book.yearPublished = book.humanReadablePublicationDates[0].replace("[", "").replace("]", "")
            res.status(201).json(book);
            console.log("Fetched from Knihovny.cz")
        } else {
                throw new Error("Something went wrong");
            }
    } catch {
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
            const data = await response.json();
            if (data.totalItems > 0) {
                const book = data.items[0];
                const info = book.volumeInfo;
                const author = info.authors ? info.authors.join(', ') : 'Unknown';
                console.log(info.authors);
                book.surname = author.split(' ').slice(-1).join(' ');
                book.name = author.split(' ').slice(0, -1).join(' '); 
                book.title = info.title;
                book.yearPublished = (info.publishedDate.split('-'))[0];
                res.status(200).json(book);
                console.log("Fetched from Google Books");
            } else {
                throw new Error("Something went wrong");
            }
        }
        catch{
            try {
                fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
                    .then(response => response.json())
                    .then(data => {
                        const book = data[`ISBN:${isbn}`];
                        console.log(book.authors);
                        const author = book.authors?.map(author => author.name).join(', ') || 'Unknown';
                        console.log(author);
                        if ((author.split(', ')[0]).split(' ').length > 1) {
                            book.surname = ((author.split(', ')[0]).split(' ').slice(-1)).join(' ');
                            book.name = ((author.split(', '))[1])}
                        else {
                            book.surname = author.split(', ')[0];
                            book.name = " ";}
                        book.yearPublished = (book.publish_date.split(' ')).pop();
                        console.log(book.publish_date);
                        res.status(200).json(book);
                        console.log("Fetched from OpenLibrary")})
                    .catch(error => {
                        res.status(500).json({ error: 'Failed to fetch book data' });
                        console.error('Error fetching from OpenLibrary:', error);
                    })}
            catch(error) {
                    res.status(500).json({ error: 'Failed to fetch book data' });
                        }}}});
                    
app.post('/api/books/add', async (req, res) => {
    try {
        const { surname } = req.body;
        const { name } = req.body;
        const { title } = req.body;
        const { year } = req.body;
        const { isbn } = req.body;
        console.log('Creating book:', title);
        
        const book = await prisma.books.create({
            data: {
                surname: surname,
                name: name,
                title: title,
                year: year,
                isbn: isbn,
            }
        });
         res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});
app.put('/api/books/update', async (req, res) => {
    // Update book in database
    const { id, surname, name, title, year, isbn } = req.body;
    // Your update logic here
    const updatedItem = await prisma.books.update({
        where: { bookId: Number(id) },
        data: {surname: surname, name: name, title: title, year: year, isbn: isbn },
    })
    res.status(200).json({ message: 'Book updated', book: updatedItem})
});
app.delete('/', async (req, res) => {
    try {
        const { id } = req.body;
        const updatedItem = await prisma.books.update({
        where: { bookId: Number(id) },
        data: { deleted: true },
      });

      res.status(200).json(updatedItem);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: 'Failed to create book' });
    }
});

app.get('/api/books/show', async (_req, res) => {
    try {
        const currentBooks = await prisma.books.findMany({
            where: { deleted: false },
            orderBy: { surname: 'asc' },
        })
        res.status(200).json(currentBooks);

    } catch (error){
        console.error('Error loading books:', error);
        res.status(500).json({ error: 'Failed to load books' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})