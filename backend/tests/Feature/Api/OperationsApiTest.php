<?php

namespace Tests\Feature\Api;

use App\Enums\BookCopyStatus;
use App\Enums\BorrowRequestStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\User;
use App\Notifications\BorrowRequestSubmittedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OperationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_report_and_csv_export_use_live_circulation_data(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $book = Book::factory()->for(Category::factory())->create(['title' => '=Transactional Libraries']);
        $copy = BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Available]);
        $request = BorrowRequest::query()->create([
            'user_id' => $member->id,
            'book_id' => $book->id,
            'status' => BorrowRequestStatus::Pending,
            'requested_at' => now(),
        ]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/approve", [
            'book_copy_id' => $copy->id,
        ])->assertOk();

        $this->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.summary.total_books', 1)
            ->assertJsonPath('data.summary.borrowed_copies', 1)
            ->assertJsonPath('data.summary.active_members', 1)
            ->assertJsonPath('data.popular_books.0.title', '=Transactional Libraries')
            ->assertJsonCount(1, 'data.current_loans');

        $this->getJson('/api/v1/admin/reports/borrowings')
            ->assertOk()
            ->assertJsonPath('data.summary.total_transactions', 1)
            ->assertJsonPath('data.popular_books.0.borrow_count', 1);

        $export = $this->get('/api/v1/admin/reports/borrowings/export')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertDownload('library-borrowing-report.csv');

        $this->assertStringContainsString("'=Transactional Libraries", $export->streamedContent());
    }

    public function test_notifications_are_owner_scoped_and_can_be_marked_read(): void
    {
        $admin = User::factory()->admin()->create();
        $other = User::factory()->admin()->create();
        $member = User::factory()->create();
        $book = Book::factory()->for(Category::factory())->create();
        BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Available]);
        $request = BorrowRequest::query()->create([
            'user_id' => $member->id,
            'book_id' => $book->id,
            'status' => BorrowRequestStatus::Pending,
            'requested_at' => now(),
        ])->load('user', 'book');
        $admin->notify(new BorrowRequestSubmittedNotification($request));
        $other->notify(new BorrowRequestSubmittedNotification($request));
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.unread_count', 1);
        $id = $response->json('data.0.id');

        $this->postJson("/api/v1/notifications/{$id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);
        $this->postJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('data.updated', 0);

        $otherId = $other->notifications()->firstOrFail()->id;
        $this->postJson("/api/v1/notifications/{$otherId}/read")->assertNotFound();
    }

    public function test_user_cannot_access_admin_operational_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
        $this->getJson('/api/v1/admin/reports/borrowings')->assertForbidden();
        $this->getJson('/api/v1/admin/loans')->assertForbidden();
    }
}
