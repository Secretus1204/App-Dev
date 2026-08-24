<?php

namespace Tests\Feature\Api;

use App\Enums\BookCopyStatus;
use App\Enums\BorrowRequestStatus;
use App\Enums\LoanStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\Loan;
use App\Models\User;
use App\Notifications\LoanDueSoonNotification;
use App\Notifications\LoanOverdueNotification;
use App\Notifications\LoanReturnedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LoanApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_approval_atomically_assigns_one_copy_and_creates_one_loan(): void
    {
        $admin = User::factory()->admin()->create();
        $firstMember = User::factory()->create();
        $secondMember = User::factory()->create();
        [$book, $copy] = $this->availableBook();
        $first = $this->request($firstMember, $book);
        $second = $this->request($secondMember, $book);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/borrow-requests/{$first->id}/approve", [
            'book_copy_id' => $copy->id,
            'due_at' => now()->addDays(7)->toISOString(),
        ])
            ->assertOk()
            ->assertJsonPath('data.loan.book_copy_id', $copy->id)
            ->assertJsonPath('data.loan.status', LoanStatus::Borrowed->value);

        $this->patchJson("/api/v1/admin/borrow-requests/{$second->id}/approve")
            ->assertConflict();

        $this->assertDatabaseCount('loans', 1);
        $this->assertDatabaseHas('book_copies', ['id' => $copy->id, 'status' => BookCopyStatus::Borrowed->value]);
        $this->assertDatabaseHas('borrow_requests', ['id' => $second->id, 'status' => BorrowRequestStatus::Pending->value]);
    }

    public function test_member_sees_only_own_loans_and_admin_can_filter_all_loans(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $other = User::factory()->create();
        $mine = $this->loan($member);
        $theirs = $this->loan($other);

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/loans')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
        $this->getJson("/api/v1/loans/{$theirs->id}")->assertForbidden();

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/loans?search='.$other->email.'&status=borrowed')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $theirs->id);
    }

    public function test_return_is_atomic_and_cannot_be_recorded_twice(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $loan = $this->loan($member);
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/admin/loans/{$loan->id}/return", [
            'return_condition' => 'good',
            'notes' => 'Returned at the desk.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', LoanStatus::Returned->value)
            ->assertJsonPath('data.return_condition', 'good');

        $this->assertDatabaseHas('book_copies', [
            'id' => $loan->book_copy_id,
            'status' => BookCopyStatus::Available->value,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $member->id,
            'type' => LoanReturnedNotification::class,
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'loan.returned']);

        $this->postJson("/api/v1/admin/loans/{$loan->id}/return")
            ->assertConflict()
            ->assertJsonPath('message', 'This loan has already been returned.');

        Sanctum::actingAs($member);
        $this->postJson('/api/v1/borrow-requests', [
            'book_id' => $loan->bookCopy()->firstOrFail()->book_id,
        ])->assertCreated();
    }

    public function test_damaged_return_keeps_the_copy_out_of_available_inventory(): void
    {
        $admin = User::factory()->admin()->create();
        $loan = $this->loan(User::factory()->create());
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/admin/loans/{$loan->id}/return", [
            'return_condition' => 'damaged',
            'notes' => 'Water damage on back cover.',
        ])->assertOk();

        $this->assertDatabaseHas('book_copies', [
            'id' => $loan->book_copy_id,
            'status' => BookCopyStatus::Damaged->value,
            'condition_notes' => 'Water damage on back cover.',
        ]);
    }

    public function test_overdue_synchronization_is_idempotent_and_notifies_once(): void
    {
        $member = User::factory()->create();
        $loan = $this->loan($member, now()->subDay());

        $this->artisan('library:sync-loans')->assertSuccessful();
        $this->artisan('library:sync-loans')->assertSuccessful();

        $this->assertDatabaseHas('loans', ['id' => $loan->id, 'status' => LoanStatus::Overdue->value]);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $member->id,
            'type' => LoanOverdueNotification::class,
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'loan.overdue']);
    }

    public function test_due_soon_notification_is_idempotent(): void
    {
        $member = User::factory()->create();
        $this->loan($member, now()->addDay());

        $this->artisan('library:sync-loans')->assertSuccessful();
        $this->artisan('library:sync-loans')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $member->id,
            'type' => LoanDueSoonNotification::class,
        ]);
    }

    private function availableBook(): array
    {
        $book = Book::factory()->for(Category::factory())->create();
        $copy = BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Available]);

        return [$book, $copy];
    }

    private function request(User $member, Book $book): BorrowRequest
    {
        return BorrowRequest::query()->create([
            'user_id' => $member->id,
            'book_id' => $book->id,
            'status' => BorrowRequestStatus::Pending,
            'requested_at' => now(),
        ]);
    }

    private function loan(User $member, mixed $dueAt = null): Loan
    {
        [$book, $copy] = $this->availableBook();
        $copy->update(['status' => BookCopyStatus::Borrowed]);
        $admin = User::factory()->admin()->create();
        $request = $this->request($member, $book);
        $request->update(['status' => BorrowRequestStatus::Approved, 'reviewed_at' => now(), 'reviewed_by' => $admin->id]);

        return Loan::query()->create([
            'borrow_request_id' => $request->id,
            'user_id' => $member->id,
            'book_copy_id' => $copy->id,
            'issued_by' => $admin->id,
            'borrowed_at' => now()->subDays(2),
            'due_at' => $dueAt ?? now()->addDays(7),
            'status' => LoanStatus::Borrowed,
        ]);
    }
}
