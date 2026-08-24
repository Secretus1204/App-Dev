<?php

namespace Tests\Feature\Api;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_only_sees_active_catalog_with_derived_availability(): void
    {
        $user = User::factory()->create();
        $activeCategory = Category::factory()->create(['name' => 'Programming']);
        $archivedCategory = Category::factory()->create(['is_active' => false]);
        $book = Book::factory()->for($activeCategory)->create(['title' => 'Data Structures']);
        BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Available]);
        BookCopy::factory()->for($book)->create(['status' => BookCopyStatus::Damaged]);
        Book::factory()->for($activeCategory)->create(['is_active' => false]);
        Book::factory()->for($archivedCategory)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Programming');

        $this->getJson('/api/v1/books')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Data Structures')
            ->assertJsonPath('data.0.total_copies', 2)
            ->assertJsonPath('data.0.available_copies', 1)
            ->assertJsonPath('data.0.availability_status', 'limited')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_catalog_search_filter_sort_and_admin_archived_visibility_work(): void
    {
        $admin = User::factory()->admin()->create();
        $category = Category::factory()->create();
        $availableBook = Book::factory()->for($category)->create([
            'title' => 'Algorithms Handbook',
            'author' => 'Ada Writer',
        ]);
        BookCopy::factory()->for($availableBook)->create(['status' => BookCopyStatus::Available]);
        Book::factory()->for($category)->create([
            'title' => 'Archived Algorithms',
            'is_active' => false,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/books?search=Algorithms&availability=available&sort=title&direction=desc')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $availableBook->id);

        $this->getJson('/api/v1/books?search=Algorithms&include_archived=1')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_user_cannot_create_catalog_records(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/categories', ['name' => 'Restricted'])
            ->assertForbidden();

        $this->postJson('/api/v1/books', [
            'category_id' => $category->id,
            'title' => 'Restricted Book',
            'author' => 'Restricted Author',
        ])->assertForbidden();
    }

    public function test_admin_can_create_update_and_archive_catalog_records(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $categoryResponse = $this->postJson('/api/v1/categories', [
            'name' => 'Engineering',
            'description' => 'Engineering books.',
        ])->assertCreated();

        $categoryId = $categoryResponse->json('data.id');

        $bookResponse = $this->postJson('/api/v1/books', [
            'category_id' => $categoryId,
            'isbn' => '9781234567890',
            'title' => 'Engineering Fundamentals',
            'author' => 'Sample Author',
            'publication_year' => 2025,
            'initial_copies' => 3,
        ])
            ->assertCreated()
            ->assertJsonPath('data.total_copies', 3)
            ->assertJsonPath('data.available_copies', 3);

        $bookId = $bookResponse->json('data.id');

        $this->patchJson("/api/v1/books/{$bookId}", ['publisher' => 'University Press'])
            ->assertOk()
            ->assertJsonPath('data.publisher', 'University Press');

        $this->patchJson("/api/v1/books/{$bookId}/archive", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->patchJson("/api/v1/categories/{$categoryId}/archive", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseCount('book_copies', 3);
        $this->assertDatabaseHas('audit_logs', ['action' => 'book.created']);
    }

    public function test_borrowed_copy_cannot_be_manually_released_or_archived(): void
    {
        $admin = User::factory()->admin()->create();
        $copy = BookCopy::factory()->create(['status' => BookCopyStatus::Borrowed]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/book-copies/{$copy->id}", ['status' => 'available'])
            ->assertConflict()
            ->assertJsonPath(
                'message',
                'A borrowed copy status can only be changed through the loan return workflow.'
            );

        $this->patchJson("/api/v1/book-copies/{$copy->id}/archive", ['archived' => true])
            ->assertConflict()
            ->assertJsonPath('message', 'A borrowed copy cannot be archived.');
    }

    public function test_admin_can_replace_a_book_cover_and_old_file_is_removed(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $book = Book::factory()->create();

        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/books/{$book->id}/cover", [
            'cover' => UploadedFile::fake()->image('first.jpg', 300, 450),
        ])->assertOk();

        $book->refresh();
        $firstPath = $book->cover_path;
        Storage::disk('public')->assertExists($firstPath);

        $this->postJson("/api/v1/books/{$book->id}/cover", [
            'cover' => UploadedFile::fake()->image('second.png', 300, 450),
        ])->assertOk();

        $book->refresh();
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($book->cover_path);
    }
}
