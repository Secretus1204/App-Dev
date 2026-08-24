<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalCopies = (int) ($this->total_copies_count ?? 0);
        $availableCopies = (int) ($this->available_copies_count ?? 0);

        $availabilityStatus = match (true) {
            $availableCopies === 0 => 'unavailable',
            $availableCopies < $totalCopies => 'limited',
            default => 'available',
        };

        return [
            'id' => $this->id,
            'isbn' => $this->isbn,
            'title' => $this->title,
            'author' => $this->author,
            'publisher' => $this->publisher,
            'publication_year' => $this->publication_year,
            'category' => $this->whenLoaded(
                'category',
                fn () => CategoryResource::make($this->category)->resolve($request),
            ),
            'description' => $this->description,
            'cover_url' => $this->cover_path === null
                ? null
                : Storage::disk('public')->url($this->cover_path),
            'total_copies' => $totalCopies,
            'available_copies' => $availableCopies,
            'availability_status' => $availabilityStatus,
            'is_active' => $this->is_active,
            'copies' => $this->whenLoaded(
                'copies',
                fn () => BookCopyResource::collection($this->copies)->resolve($request),
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
