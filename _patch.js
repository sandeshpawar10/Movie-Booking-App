const fs = require('fs');
let c = fs.readFileSync('src/controllers/bookingController.js', 'utf8');
const target = 'book.paymentStatus = "failed";\r\n\r\n        await book.save();';
const replacement = 'book.paymentStatus = "failed";\r\n        if (req.body && req.body.reason) {\r\n            book.cancellationReason = req.body.reason;\r\n        }\r\n\r\n        await book.save();';
c = c.replace(target, replacement);
fs.writeFileSync('src/controllers/bookingController.js', c);
console.log('done');
