<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_library_mvp_tables_and_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumns('users', [
            'member_id',
            'role',
            'status',
            'must_change_password',
            'last_login_at',
            'created_by',
        ]));

        foreach ([
            'categories',
            'books',
            'book_copies',
            'borrow_requests',
            'loans',
            'notifications',
            'audit_logs',
            'personal_access_tokens',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Expected table [{$table}] to exist.");
        }
    }
}
