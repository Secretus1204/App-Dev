<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysRemaining = $this->returned_at === null
            ? (int) now()->startOfDay()->diffInDays($this->due_at->copy()->startOfDay(), false)
            : null;

        return [
            'id' => $this->id,
            'reference' => sprintf('LOAN-%06d', $this->id),
            'status' => $this->status->value,
            'borrow_request_id' => $this->borrow_request_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'member_id' => $this->user->member_id,
                'email' => $this->user->email,
            ]),
            'book_copy' => $this->whenLoaded('bookCopy', fn () => [
                'id' => $this->bookCopy->id,
                'accession_number' => $this->bookCopy->accession_number,
                'barcode' => $this->bookCopy->barcode,
                'status' => $this->bookCopy->status->value,
                'book' => [
                    'id' => $this->bookCopy->book->id,
                    'title' => $this->bookCopy->book->title,
                    'author' => $this->bookCopy->book->author,
                    'isbn' => $this->bookCopy->book->isbn,
                    'category' => $this->bookCopy->book->category?->name,
                    'cover_url' => $this->bookCopy->book->cover_path === null
                        ? null
                        : Storage::disk('public')->url($this->bookCopy->book->cover_path),
                ],
            ]),
            'issued_by' => $this->whenLoaded('issuer', fn () => [
                'id' => $this->issuer->id,
                'name' => $this->issuer->name,
            ]),
            'received_by' => $this->whenLoaded('receiver', fn () => $this->receiver === null ? null : [
                'id' => $this->receiver->id,
                'name' => $this->receiver->name,
            ]),
            'borrowed_at' => $this->borrowed_at?->toISOString(),
            'due_at' => $this->due_at?->toISOString(),
            'returned_at' => $this->returned_at?->toISOString(),
            'days_remaining' => $daysRemaining,
            'is_due_soon' => $daysRemaining !== null
                && $daysRemaining >= 0
                && $daysRemaining <= (int) config('library.due_soon_days'),
            'return_condition' => $this->return_condition,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
