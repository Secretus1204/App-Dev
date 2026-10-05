<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookCopyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_id' => $this->book_id,
            'accession_number' => $this->accession_number,
            'barcode' => $this->barcode,
            // The physical label must identify an individual copy, not only
            // a title, because multiple copies can be borrowed separately.
            'qr_code' => $this->qr_code,
            'status' => $this->status->value,
            'condition_notes' => $this->condition_notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
