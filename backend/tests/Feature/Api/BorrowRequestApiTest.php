<?php

namespace Tests\Feature\Api;

use App\Enums\BookCopyStatus;
use App\Enums\BorrowRequestStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BorrowRequest;
use App\Models\Category;
use App\Models\User;
use App\Notifications\BorrowRequestReviewedNotification;
use App\Notifications\LoanCreatedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BorrowRequestApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_submit_and_only_list_or_view_own_requests(): void
    {
        $member = User::factory()->create();
        $otherMember = User::factory()->create();
        $book = $this->availableBook(['title' => 'API Design']);
        BorrowRequest::query()->create([
            'user_id' => $otherMember->id,
            'book_id' => $book->id,
            'status' => BorrowRequestStatus::Pending,
            'requested_at' => now(),
        ]);

        Sanctum::actingAs($member);

        $created = $this->postJson('/api/v1/borrow-requests', ['book_id' => $book->id])
            ->assertCreated()
            ->assertJsonPath('data.reference', 'REQ-000002')
            ->assertJsonPath('data.status', BorrowRequestStatus::Pending->value)
            ->assertJsonPath('data.user.id', $member->id)
            ->assertJsonPath('data.book.title', 'API Design')
            ->assertJsonPath('data.book.available_copies', 1);

        $requestId = $created->json('data.id');

        $this->getJson('/api/v1/borrow-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $requestId);

        $this->getJson("/api/v1/borrow-requests/{$requestId}")
            ->assertOk()
            ->assertJsonPath('data.user.id', $member->id);

        $otherRequest = BorrowRequest::query()->where('user_id', $otherMember->id)->firstOrFail();
        $this->getJson("/api/v1/borrow-requests/{$otherRequest->id}")->assertForbidden();
        $this->assertDatabaseHas('audit_logs', ['action' => 'borrow_request.created']);
    }

    public function test_request_creation_rejects_duplicate_unavailable_and_archived_catalog_books(): void
    {
        $member = User::factory()->create();
        $availableBook = $this->availableBook();
        $unavailableBook = Book::factory()->create();
        BookCopy::factory()->for($unavailableBook)->create(['status' => BookCopyStatus::Borrowed]);
        $archivedBook = $this->availableBook(['is_active' => false]);

        Sanctum::actingAs($member);

        $this->postJson('/api/v1/borrow-requests', ['book_id' => $availableBook->id])
            ->assertCreated();

        $this->postJson('/api/v1/borrow-requests', ['book_id' => $availableBook->id])
            ->assertConflict()
            ->assertJsonPath('message', 'You already have an active request for this book.');

        $this->postJson('/api/v1/borrow-requests', ['book_id' => $unavailableBook->id])
            ->assertConflict()
            ->assertJsonPath('message', 'This book currently has no available copies.');

        $this->postJson('/api/v1/borrow-requests', ['book_id' => $archivedBook->id])
            ->assertConflict()
            ->assertJsonPath('message', 'Borrow requests are only allowed for active catalog books.');
    }

    public function test_member_can_cancel_only_their_pending_request(): void
    {
        $member = User::factory()->create();
        $book = $this->availableBook();
        $pending = $this->borrowRequest($member, $book);
        $approved = $this->borrowRequest($member, $this->availableBook(), BorrowRequestStatus::Approved);

        Sanctum::actingAs($member);

        $this->patchJson("/api/v1/borrow-requests/{$pending->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', BorrowRequestStatus::Cancelled->value);

        $this->patchJson("/api/v1/borrow-requests/{$approved->id}/cancel")
            ->assertForbidden();

        $this->assertDatabaseHas('audit_logs', ['action' => 'borrow_request.cancelled']);
    }

    public function test_admin_can_search_filter_and_paginate_requests(): void
    {
        $admin = User::factory()->admin()->create();
        $alpha = User::factory()->create(['name' => 'Alpha Member', 'member_id' => 'MEM-ALPHA']);
        $beta = User::factory()->create(['name' => 'Beta Member']);
        $this->borrowRequest($alpha, $this->availableBook(['title' => 'Algorithms']), BorrowRequestStatus::Pending);
        $this->borrowRequest($beta, $this->availableBook(['title' => 'Biology']), BorrowRequestStatus::Rejected);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/borrow-requests?search=Alpha&status=pending&sort=requested_at&direction=asc&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.member_id', 'MEM-ALPHA')
            ->assertJsonPath('data.0.book.title', 'Algorithms')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_approve_pending_request_and_member_is_notified(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $request = $this->borrowRequest($member, $this->availableBook());
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/approve", [
            'admin_notes' => 'Bring your library card for checkout.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', BorrowRequestStatus::Approved->value)
            ->assertJsonPath('data.reviewed_by.id', $admin->id)
            ->assertJsonPath('data.admin_notes', 'Bring your library card for checkout.')
            ->assertJsonPath('data.rejection_reason', null);

        $this->assertDatabaseHas('borrow_requests', [
            'id' => $request->id,
            'status' => BorrowRequestStatus::Approved->value,
            'reviewed_by' => $admin->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $member->id,
            'type' => LoanCreatedNotification::class,
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'borrow_request.approved']);
        $this->assertDatabaseHas('loans', [
            'borrow_request_id' => $request->id,
            'user_id' => $member->id,
            'status' => 'borrowed',
        ]);
        $this->assertDatabaseHas('book_copies', [
            'book_id' => $request->book_id,
            'status' => BookCopyStatus::Borrowed->value,
        ]);

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/approve")
            ->assertConflict()
            ->assertJsonPath('message', 'Only pending borrow requests can be reviewed.');
    }

    public function test_approval_rechecks_current_book_availability(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $book = $this->availableBook();
        $request = $this->borrowRequest($member, $book);
        $book->copies()->update(['status' => BookCopyStatus::Borrowed]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/approve")
            ->assertConflict()
            ->assertJsonPath('message', 'This request cannot be approved because no active copy is available.');

        $this->assertDatabaseHas('borrow_requests', [
            'id' => $request->id,
            'status' => BorrowRequestStatus::Pending->value,
        ]);
    }

    public function test_admin_can_reject_with_required_reason_and_member_is_notified(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $request = $this->borrowRequest($member, $this->availableBook());
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/reject", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rejection_reason');

        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/reject", [
            'rejection_reason' => 'Membership details require verification.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', BorrowRequestStatus::Rejected->value)
            ->assertJsonPath('data.rejection_reason', 'Membership details require verification.');

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $member->id,
            'type' => BorrowRequestReviewedNotification::class,
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'borrow_request.rejected']);
    }

    public function test_role_boundaries_are_enforced_for_request_and_review_routes(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $request = $this->borrowRequest($member, $this->availableBook());

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/borrow-requests', ['book_id' => $request->book_id])->assertForbidden();

        Sanctum::actingAs($member);
        $this->getJson('/api/v1/admin/borrow-requests')->assertForbidden();
        $this->patchJson("/api/v1/admin/borrow-requests/{$request->id}/approve")->assertForbidden();
    }

    private function availableBook(array $attributes = []): Book
    {
        $category = Category::factory()->create();
        $book = Book::factory()->for($category)->create($attributes);
        BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Available]);

        return $book;
    }

    private function borrowRequest(
        User $member,
        Book $book,
        BorrowRequestStatus $status = BorrowRequestStatus::Pending,
    ): BorrowRequest {
        return BorrowRequest::query()->create([
            'user_id' => $member->id,
            'book_id' => $book->id,
            'status' => $status,
            'requested_at' => now(),
            'reviewed_at' => $status === BorrowRequestStatus::Pending ? null : now(),
        ]);
    }
}
