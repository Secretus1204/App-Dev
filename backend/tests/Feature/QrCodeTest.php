<?php

namespace Tests\Feature;

use App\Models\BookCopy;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_and_book_copies_receive_distinct_qr_values(): void
    {
        $firstMember = User::factory()->create();
        $secondMember = User::factory()->create();
        $firstCopy = BookCopy::factory()->create();
        $secondCopy = BookCopy::factory()->create();

        $this->assertMatchesRegularExpression('/^RCJK-MEMBER-/', (string) $firstMember->library_card_code);
        $this->assertNotSame($firstMember->library_card_code, $secondMember->library_card_code);
        $this->assertMatchesRegularExpression('/^RCJK-COPY-/', (string) $firstCopy->qr_code);
        $this->assertNotSame($firstCopy->qr_code, $secondCopy->qr_code);
    }
}
