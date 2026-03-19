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
