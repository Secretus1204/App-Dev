<?php

namespace Tests\Feature;

use Database\Seeders\DemoCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_catalog_seeder_creates_a_repeat_safe_catalog(): void
    {
        $this->seed(DemoCatalogSeeder::class);
        $this->seed(DemoCatalogSeeder::class);

        $this->assertDatabaseHas('books', ['isbn' => '9780000000001', 'title' => 'Clean Architecture']);
        $this->assertDatabaseHas('books', ['isbn' => '9780000000020', 'title' => 'Nineteen Eighty-Four']);
        $this->assertDatabaseHas('book_copies', ['accession_number' => 'DEMO-001-01', 'status' => 'available']);
        $this->assertDatabaseCount('books', 20);
        $this->assertDatabaseCount('book_copies', 40);
    }
}
