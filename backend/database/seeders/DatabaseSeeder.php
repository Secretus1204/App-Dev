<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────────────────────
        $admin = User::create([
            'member_id' => 'LIB-ADMIN-001',
            'name'      => 'Dr. Roberto Cruz',
            'email'     => 'admin@library.edu',
            'password'  => Hash::make('password'),
            'role'      => 'admin',
            'status'    => 'active',
        ]);

        // ── Members ────────────────────────────────────────────────────────────
        $members = [
            ['name' => 'Maria Santos',   'email' => 'maria.santos@university.edu',   'member_id' => 'LIB-2024-001'],
            ['name' => 'James Reyes',    'email' => 'james.reyes@university.edu',    'member_id' => 'LIB-2024-002'],
            ['name' => 'Ana Cruz',       'email' => 'ana.cruz@university.edu',       'member_id' => 'LIB-2024-003'],
            ['name' => 'Carlos Bautista','email' => 'carlos.bautista@university.edu','member_id' => 'LIB-2024-004'],
            ['name' => 'Sofia Lim',      'email' => 'sofia.lim@university.edu',      'member_id' => 'LIB-2024-005'],
        ];

        $users = [];
        foreach ($members as $i => $member) {
            $status = ($i === 4) ? 'inactive' : 'active';
            $users[] = User::create(array_merge($member, [
                'password' => Hash::make('password'),
                'role'     => 'user',
                'status'   => $status,
            ]));
        }

        // ── Categories ─────────────────────────────────────────────────────────
        $categoryData = [
            ['name' => 'Programming',  'description' => 'Computer programming and software development'],
            ['name' => 'Science',      'description' => 'Natural sciences, physics, chemistry, biology'],
            ['name' => 'Mathematics',  'description' => 'Pure and applied mathematics'],
            ['name' => 'Literature',   'description' => 'Classic and contemporary fiction and poetry'],
            ['name' => 'History',      'description' => 'World history and historical analysis'],
            ['name' => 'Technology',   'description' => 'Information technology and systems'],
            ['name' => 'Philosophy',   'description' => 'Philosophical thought and ethics'],
            ['name' => 'Economics',    'description' => 'Economic theory and business studies', 'status' => 'inactive'],
        ];

        $categories = [];
        foreach ($categoryData as $cat) {
            $categories[$cat['name']] = Category::create([
                'name'        => $cat['name'],
                'description' => $cat['description'],
                'status'      => $cat['status'] ?? 'active',
            ]);
        }

        // ── Books ──────────────────────────────────────────────────────────────
        $bookData = [
            ['isbn' => '978-0-13-1103', 'title' => 'The C Programming Language', 'author' => 'Brian W. Kernighan', 'category' => 'Programming', 'quantity' => 5, 'available_quantity' => 3],
            ['isbn' => '978-0-201-633', 'title' => 'Design Patterns',            'author' => 'Gang of Four',        'category' => 'Programming', 'quantity' => 4, 'available_quantity' => 1],
            ['isbn' => '978-0-13-4685', 'title' => 'Clean Code',                 'author' => 'Robert C. Martin',    'category' => 'Programming', 'quantity' => 6, 'available_quantity' => 0, 'status' => 'unavailable'],
            ['isbn' => '978-0-07-356',  'title' => 'Database Systems',           'author' => 'Thomas M. Connolly',  'category' => 'Science',     'quantity' => 8, 'available_quantity' => 5],
            ['isbn' => '978-0-13-5555', 'title' => 'Introduction to Algorithms', 'author' => 'Cormen et al.',       'category' => 'Mathematics', 'quantity' => 3, 'available_quantity' => 2, 'status' => 'limited'],
        ];

        $books = [];
        foreach ($bookData as $bData) {
            $books[] = Book::create([
                'isbn'               => $bData['isbn'],
                'title'              => $bData['title'],
                'author'             => $bData['author'],
                'category_id'        => $categories[$bData['category']]->id,
                'quantity'           => $bData['quantity'],
                'available_quantity' => $bData['available_quantity'],
                'status'             => $bData['status'] ?? ($bData['available_quantity'] === 0 ? 'unavailable' : ($bData['available_quantity'] <= 2 ? 'limited' : 'available')),
                'publication_year'   => 2024,
            ]);
        }

        // ── Borrow Requests ────────────────────────────────────────────────────
        $req1 = BorrowRequest::create([
            'user_id'      => $users[0]->id,
            'book_id'      => $books[2]->id, // Clean Code
            'status'       => 'pending',
            'request_date' => Carbon::parse('2024-12-10'),
        ]);
        $req2 = BorrowRequest::create([
            'user_id'      => $users[1]->id,
            'book_id'      => $books[1]->id, // Design Patterns
            'status'       => 'pending',
            'request_date' => Carbon::parse('2024-12-11'),
        ]);
        BorrowRequest::create([
            'user_id'      => $users[3]->id,
            'book_id'      => $books[4]->id, // Introduction to Algorithms
            'status'       => 'pending',
            'request_date' => Carbon::parse('2024-12-12'),
        ]);

        // Overdue
        BorrowRequest::create([
            'user_id'      => $users[3]->id,
            'book_id'      => $books[3]->id, // Database Systems
            'status'       => 'overdue',
            'request_date' => Carbon::parse('2024-11-08'),
            'borrow_date'  => Carbon::parse('2024-11-10'),
            'due_date'     => Carbon::parse('2024-12-10'),
        ]);

        // Returned
        BorrowRequest::create([
            'user_id'       => $users[0]->id,
            'book_id'       => $books[0]->id,
            'status'        => 'returned',
            'request_date'  => Carbon::parse('2024-11-01'),
            'borrow_date'   => Carbon::parse('2024-11-03'),
            'due_date'      => Carbon::parse('2024-11-17'),
            'returned_date' => Carbon::parse('2024-11-16'),
        ]);

        // ── Notifications ──────────────────────────────────────────────────────
        Notification::create([
            'user_id' => $users[0]->id,
            'title'   => 'Book Return Confirmed',
            'message' => 'Thank you! "The C Programming Language" has been returned successfully.',
            'type'    => 'return_confirmed',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $users[3]->id,
            'title'   => 'Book Overdue',
            'message' => 'Your borrowed book "Database Systems" is overdue. Please return it immediately.',
            'type'    => 'overdue_warning',
            'is_read' => false,
        ]);

        $this->command->info('✅ Database seeded with admin, 5 members, 8 categories, 5 books, borrow requests, and notifications!');
    }
}
