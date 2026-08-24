<?php

namespace Database\Seeders;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use Illuminate\Database\Seeder;

class DemoCatalogSeeder extends Seeder
{
    /**
     * Seed a repeat-safe catalog for local and staging demonstrations.
     * It intentionally creates no user accounts, loans, or requests.
     */
    public function run(): void
    {
        $categories = [];

        foreach ([
            'Fiction' => 'Novels, short stories, and literary works.',
            'Non-Fiction' => 'Informational and factual works.',
            'Science and Technology' => 'Science, computing, and technology resources.',
            'History' => 'Historical studies and reference materials.',
            'Education' => 'Teaching, learning, and academic resources.',
        ] as $name => $description) {
            $categories[$name] = Category::query()->updateOrCreate(
                ['name' => $name],
                ['description' => $description, 'is_active' => true],
            );
        }

        $catalog = [
            ['category' => 'Science and Technology', 'isbn' => '9780000000001', 'title' => 'Clean Architecture', 'author' => 'Robert C. Martin', 'publisher' => 'Pearson', 'year' => 2017],
            ['category' => 'Science and Technology', 'isbn' => '9780000000002', 'title' => 'Clean Code', 'author' => 'Robert C. Martin', 'publisher' => 'Prentice Hall', 'year' => 2008],
            ['category' => 'Science and Technology', 'isbn' => '9780000000003', 'title' => 'Effective Java', 'author' => 'Joshua Bloch', 'publisher' => 'Addison-Wesley', 'year' => 2018],
            ['category' => 'Science and Technology', 'isbn' => '9780000000004', 'title' => 'Introduction to Algorithms', 'author' => 'Thomas H. Cormen', 'publisher' => 'MIT Press', 'year' => 2022],
            ['category' => 'Science and Technology', 'isbn' => '9780000000005', 'title' => 'The Pragmatic Programmer', 'author' => 'David Thomas and Andrew Hunt', 'publisher' => 'Addison-Wesley', 'year' => 2019],
            ['category' => 'Science and Technology', 'isbn' => '9780000000006', 'title' => 'Design Patterns', 'author' => 'Erich Gamma and others', 'publisher' => 'Addison-Wesley', 'year' => 1994],
            ['category' => 'Science and Technology', 'isbn' => '9780000000007', 'title' => 'Learning React', 'author' => 'Alex Banks and Eve Porcello', 'publisher' => 'O Reilly Media', 'year' => 2024],
            ['category' => 'Science and Technology', 'isbn' => '9780000000008', 'title' => 'Laravel Up and Running', 'author' => 'Matt Stauffer', 'publisher' => 'O Reilly Media', 'year' => 2024],
            ['category' => 'Science and Technology', 'isbn' => '9780000000009', 'title' => 'Database System Concepts', 'author' => 'Abraham Silberschatz and others', 'publisher' => 'McGraw Hill', 'year' => 2019],
            ['category' => 'Science and Technology', 'isbn' => '9780000000010', 'title' => 'Computer Networking', 'author' => 'James F. Kurose and Keith W. Ross', 'publisher' => 'Pearson', 'year' => 2021],
            ['category' => 'Education', 'isbn' => '9780000000011', 'title' => 'How Learning Works', 'author' => 'Susan A. Ambrose and others', 'publisher' => 'Jossey Bass', 'year' => 2010],
            ['category' => 'Education', 'isbn' => '9780000000012', 'title' => 'Make It Stick', 'author' => 'Peter C. Brown and others', 'publisher' => 'Harvard University Press', 'year' => 2014],
            ['category' => 'History', 'isbn' => '9780000000013', 'title' => 'Sapiens', 'author' => 'Yuval Noah Harari', 'publisher' => 'Harper', 'year' => 2015],
            ['category' => 'History', 'isbn' => '9780000000014', 'title' => 'The Art of War', 'author' => 'Sun Tzu', 'publisher' => 'Academic Press', 'year' => 2008],
            ['category' => 'History', 'isbn' => '9780000000015', 'title' => 'A Short History of Nearly Everything', 'author' => 'Bill Bryson', 'publisher' => 'Broadway Books', 'year' => 2004],
            ['category' => 'Non-Fiction', 'isbn' => '9780000000016', 'title' => 'Atomic Habits', 'author' => 'James Clear', 'publisher' => 'Avery', 'year' => 2018],
            ['category' => 'Non-Fiction', 'isbn' => '9780000000017', 'title' => 'The Psychology of Money', 'author' => 'Morgan Housel', 'publisher' => 'Harriman House', 'year' => 2020],
            ['category' => 'Fiction', 'isbn' => '9780000000018', 'title' => 'The Alchemist', 'author' => 'Paulo Coelho', 'publisher' => 'HarperOne', 'year' => 2014],
            ['category' => 'Fiction', 'isbn' => '9780000000019', 'title' => 'To Kill a Mockingbird', 'author' => 'Harper Lee', 'publisher' => 'Harper Perennial', 'year' => 2006],
            ['category' => 'Fiction', 'isbn' => '9780000000020', 'title' => 'Nineteen Eighty-Four', 'author' => 'George Orwell', 'publisher' => 'Penguin Books', 'year' => 2021],
        ];

        foreach ($catalog as $index => $item) {
            $book = Book::query()->updateOrCreate(
                ['isbn' => $item['isbn']],
                [
                    'category_id' => $categories[$item['category']]->id,
                    'title' => $item['title'],
                    'author' => $item['author'],
                    'publisher' => $item['publisher'],
                    'publication_year' => $item['year'],
                    'description' => "Demonstration catalog title: {$item['title']}.",
                    'is_active' => true,
                ],
            );

            foreach ([1, 2] as $copyNumber) {
                $accessionNumber = sprintf('DEMO-%03d-%02d', $index + 1, $copyNumber);

                // Do not reset an existing copy. A local demonstration loan or
                // return remains intact when the seed is run again.
                BookCopy::query()->firstOrCreate(
                    ['accession_number' => $accessionNumber],
                    [
                        'book_id' => $book->id,
                        'barcode' => "BARCODE-{$accessionNumber}",
                        'status' => BookCopyStatus::Available->value,
                    ],
                );
            }
        }
    }
}
