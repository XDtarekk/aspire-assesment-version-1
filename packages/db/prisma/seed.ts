import bcrypt from 'bcrypt';
import { PrismaClient, Role, BookStatus } from '@prisma/client';

const prisma = new PrismaClient();

const LIBRARIAN_EMAIL = process.env.LIBRARIAN_EMAIL || 'librarian@example.com';
const LIBRARIAN_PASSWORD = process.env.LIBRARIAN_PASSWORD || 'librarian123';
const SALT_ROUNDS = 10;

const sampleBooks = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', description: 'A story of decadence and the American Dream.', tags: ['fiction', 'classic'] },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', description: 'Racial injustice in the American South.', tags: ['fiction', 'classic'] },
  { title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', description: 'Dystopian totalitarian regime.', tags: ['fiction', 'dystopia'] },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8', description: 'Romance and social commentary.', tags: ['fiction', 'romance'] },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', description: 'Teenage alienation and identity.', tags: ['fiction', 'classic'] },
  { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', isbn: '978-0-7475-3269-9', description: 'A young wizard discovers his destiny.', tags: ['fiction', 'fantasy'] },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0-547-92822-7', description: 'Bilbo Baggins embarks on an adventure.', tags: ['fiction', 'fantasy'] },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0-13-235088-4', description: 'A handbook of agile software craftsmanship.', tags: ['programming', 'software'] },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '978-1-4493-7332-0', description: 'The big ideas behind reliable systems.', tags: ['programming', 'databases'] },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0-307-88791-7', description: 'How to build a sustainable business.', tags: ['business', 'startup'] },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log('Upserted admin:', admin.email);

  const librarianPasswordHash = await bcrypt.hash(LIBRARIAN_PASSWORD, SALT_ROUNDS);
  const librarian = await prisma.user.upsert({
    where: { email: LIBRARIAN_EMAIL },
    update: { role: Role.LIBRARIAN, passwordHash: librarianPasswordHash },
    create: {
      email: LIBRARIAN_EMAIL,
      name: 'Librarian',
      role: Role.LIBRARIAN,
      passwordHash: librarianPasswordHash,
    },
  });
  console.log('Upserted librarian:', librarian.email);

  for (const b of sampleBooks) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        description: b.description,
        tags: b.tags,
        status: BookStatus.AVAILABLE,
      },
    });
  }
  console.log('Seeded', sampleBooks.length, 'books');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
