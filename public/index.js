function isValidISBN(isbn) {
    // Check for ISBN-13 format: 13 digits, optional hyphens
    if (/^\d{1,5}-\d+-\d+-\d+-\d{1,6}$/.test(isbn) || /^\d{13}$/.test(isbn)) {
        const cleaned = isbn.replace(/[^0-9]/g, '');
        if (cleaned.length !== 13) return false;

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(cleaned[i], 10);
            sum += (i % 2 === 0) ? digit : digit * 3;
        }
        const lastDigit = parseInt(cleaned[12], 10);
        sum += lastDigit;
        return sum % 10 === 0;
    }
    // Check for ISBN-10 format: 10 digits, optional hyphens, 'X' only allowed as last character
    else if (/^\d{1,5}-\d+-\d+-\d+-[0-9X]$/i.test(isbn) || /^\d{9}[0-9X]$/i.test(isbn)) {
        const cleaned = isbn.replace(/[^0-9X]/gi, '').toUpperCase();
        if (cleaned.length !== 10) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            const digit = parseInt(cleaned[i], 10);
            sum += digit * (10 - i);
        }
        const lastChar = cleaned[9];
        if (lastChar === 'X') {
            sum += 10;
        } else {
            const lastDigit = parseInt(lastChar, 10);
            if (isNaN(lastDigit)) return false;
            sum += lastDigit;
        }
        return sum % 11 === 0;
    }
    // Invalid format
    else {
        return false;
    }
}

async function addBookByISBN(isbn) {
                var table = document.getElementById("table");  
                const getBook = await fetch(baseURL+`/api/books/isbn?isbn=${isbn}`)
                book = await getBook.json();
                if (!book.name) { //Handles the cases of a single named author, where the API returns the name in the surname field and leaves the name field empty
                    book.name = "";
                }
                if (!book.surname) {
                    book.surname = book.name;
                    book.name = "";
                }
                var surname = book.surname;
                var name = book.name;
                var title = book.title;
                var yearPublished = Number(book.yearPublished);
                if (!title || !surname || !name || !yearPublished) {
                    alert('Přidání knihy podle ISBN se nezdařilo. Zkontrolujte prosím zadané ISBN nebo vyplňte všechna pole ručně.');
                    return}
                try {
                    var row = table.insertRow(-1);
                    var bookSurname = row.insertCell(0);
                    var bookName = row.insertCell(1);
                    var bookTitle = row.insertCell(2);
                    var datePublished = row.insertCell(3);
                    var bookIsbn = row.insertCell(4);
                    var deleteBook = row.insertCell(5);
                    deleteBook.innerHTML = `<button class="editButton" onclick="editRow(this)">Upravit</button><button onclick="deleteBook(this)">Odstranit</button>`;
                    bookSurname.innerHTML = surname;
                    bookName.innerHTML = name;
                    bookTitle.innerHTML = title;
                    datePublished.innerHTML = yearPublished;
                    bookIsbn.innerHTML = isbn;
                    const response = await fetch(baseURL+"/api/books/add", {
                        method: 'POST',
                        headers: {
                            "Content-Type": 'application/json'
                        },
                        body: JSON.stringify({
                            surname: surname,
                            name: name,
                            title: title,
                            year: yearPublished,
                            isbn: isbn
                        })
                    })
                    const newItem = await response.json();
                    row.id = newItem.bookid
                    document.getElementById("addBookForm").reset();
                } catch (error) {
                    alert('Chyba při přidávání knihy. Zkuste to prosím znovu.');
                    console.error('Error adding book:', error);
                }}

function scanBooks() {
            document.getElementById('scanning').innerHTML = '<div id="scanner"></div>';
            const scanner = new Html5QrcodeScanner('scanner', { 
                // Scanner will be initialized in DOM inside element with id of 'reader'
                qrbox: {
                    width: 500,
                    height: 200,
                },  // Sets dimensions of scanning box (set relative to reader element width)
                fps: 20, // Frames per second to attempt a scan
            });
            scanner.render(success, error);
            function stopScanning() {
                document.getElementById('scanning').innerHTML = '<button type="button" id="scanBooksButton" onclick="scanBooks()">Skenovat knihy</button>';
                return;
            }
            button = document.getElementById('html5-qrcode-button-camera-stop')
            button.onclick = function() {stopScanning()}
            // Starts scanner
            function success(result) {
               if (isValidISBN(result) == false) { //Calls a function, which returns, whether the ISBN provided is valid
                        alert('ISBN není validní');
                        return}
                addBookByISBN(result);
                scanBooks();
                return;
            }
            function error(err) {
                console.error(err);
                // Prints any errors to the console
            }
        }