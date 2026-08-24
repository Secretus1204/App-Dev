<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BorrowRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $availableCopies = (int) ($this->book?->available_copies_count ?? 0);
        $totalCopies = (int) ($this->book?->total_copies_count ?? 0);

        return [
            'id' => $this->id,
            'reference' => sprintf('REQ-%06d', $this->id),
            'status' => $this->status->value,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'member_id' => $this->user->member_id,
                'email' => $this->user->email,
                'role' => $this->user->role->value,
                'status' => $this->user->status->value,
            ]),
            'book' => $this->whenLoaded('book', fn () => [
                'id' => $this->book->id,
                'isbn' => $this->book->isbn,
                'title' => $this->book->title,
                'author' => $this->book->author,
                'cover_url' => $this->book->cover_path === null
                    ? null
                    : Storage::disk('public')->url($this->book->cover_path),
                'category' => $this->book->category?->name,
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'availability_status' => match (true) {
                    $availableCopies === 0 => 'unavailable',
                    $availableCopies < $totalCopies => 'limited',
                    default => 'available',
                },
                'is_active' => $this->book->is_active,
            ]),
            'reviewed_by' => $this->whenLoaded('reviewer', fn () => $this->reviewer === null ? null : [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
                'email' => $this->reviewer->email,
            ]),
            'loan' => $this->whenLoaded('loan', fn () => $this->loan === null ? null : [
                'id' => $this->loan->id,
                'reference' => sprintf('LOAN-%06d', $this->loan->id),
                'status' => $this->loan->status->value,
                'book_copy_id' => $this->loan->book_copy_id,
                'accession_number' => $this->loan->bookCopy?->accession_number,
                'borrowed_at' => $this->loan->borrowed_at?->toISOString(),
                'due_at' => $this->loan->due_at?->toISOString(),
            ]),
            'rejection_reason' => $this->rejection_reason,
            'admin_notes' => $this->admin_notes,
            'requested_at' => $this->requested_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
