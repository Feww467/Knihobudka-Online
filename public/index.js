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

function scanBooks() {

            const scanner = new Html5QrcodeScanner('scanner', { 
                // Scanner will be initialized in DOM inside element with id of 'reader'
                qrbox: {
                    width: 500,
                    height: 200,
                },  // Sets dimensions of scanning box (set relative to reader element width)
                fps: 20, // Frames per second to attempt a scan
            });
            scanner.render(success, error);
            // Starts scanner
            function success(result) {
                document.getElementById('result').innerHTML = `
                <h2>Success!</h2>
                <p><a href="${result}">${result}</a></p>
                `;
                // Prints result as a link inside result element
                scanner.clear();
                // Clears scanning instance
                document.getElementById('reader').remove();
                // Removes reader element from DOM since no longer needed
            }
            function error(err) {
                console.error(err);
                // Prints any errors to the console
            }
        }